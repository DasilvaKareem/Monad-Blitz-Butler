import { NextRequest, NextResponse } from "next/server";

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const website = searchParams.get("website");

  if (!website) {
    return NextResponse.json({ error: "Missing website parameter" }, { status: 400 });
  }

  try {
    // Use Tavily Extract API for intelligent content extraction
    if (TAVILY_API_KEY) {
      const tavilyResponse = await fetch("https://api.tavily.com/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          urls: [website],
        }),
      });

      const tavilyData = await tavilyResponse.json();

      if (tavilyData.results && tavilyData.results.length > 0) {
        const content = tavilyData.results[0].raw_content || "";

        // Extract prices
        const pricePattern = /\$\d+\.?\d*/g;
        const prices = content.match(pricePattern) || [];
        const uniquePrices = [...new Set(prices)].slice(0, 20);

        // Extract menu items - look for lines with prices
        const menuItemPattern = /([A-Z][^$\n]{3,50})\s*\$(\d+\.?\d*)/g;
        const menuItems: { name: string; price: string }[] = [];
        let match;
        while ((match = menuItemPattern.exec(content)) !== null && menuItems.length < 20) {
          menuItems.push({
            name: match[1].trim(),
            price: `$${match[2]}`,
          });
        }

        // Extract food categories
        const foodKeywords = [
          "appetizer", "starter", "salad", "soup", "entree", "main",
          "sandwich", "burger", "pizza", "pasta", "taco", "burrito",
          "sushi", "roll", "bowl", "plate", "combo", "special",
          "dessert", "drink", "beverage", "beer", "wine", "cocktail",
          "breakfast", "lunch", "dinner", "brunch", "vegetarian", "vegan"
        ];

        const foundCategories: string[] = [];
        const lowerContent = content.toLowerCase();
        for (const keyword of foodKeywords) {
          if (lowerContent.includes(keyword)) {
            foundCategories.push(keyword);
          }
        }

        // Look for menu links in the extracted content
        const menuLinkPattern = /(https?:\/\/[^\s]+(?:menu|order|food|delivery)[^\s]*)/gi;
        const menuLinks = content.match(menuLinkPattern) || [];

        return NextResponse.json({
          success: true,
          website,
          menuItems: menuItems.length > 0 ? menuItems : null,
          pricesFound: uniquePrices,
          foodCategories: [...new Set(foundCategories)],
          menuLinks: [...new Set(menuLinks)].slice(0, 5),
          rawContentPreview: content.substring(0, 500) + "...",
          note: menuItems.length > 0
            ? `Found ${menuItems.length} menu items with prices.`
            : "Menu content extracted. Check prices and categories for details.",
        });
      }
    }

    // Fallback: Direct fetch if Tavily fails
    const response = await fetch(website, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MonadButler/1.0)",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch website" }, { status: 400 });
    }

    const html = await response.text();

    // Extract prices
    const pricePattern = /\$\d+\.?\d*/g;
    const prices = html.match(pricePattern) || [];
    const uniquePrices = [...new Set(prices)].slice(0, 20);

    // Look for menu links
    const menuLinkPatterns = [
      /href=["']([^"']*menu[^"']*)["']/gi,
      /href=["']([^"']*order[^"']*)["']/gi,
    ];

    const menuLinks: string[] = [];
    for (const pattern of menuLinkPatterns) {
      let match;
      while ((match = pattern.exec(html)) !== null) {
        let link = match[1];
        if (link.startsWith("/")) {
          const url = new URL(website);
          link = `${url.origin}${link}`;
        } else if (!link.startsWith("http")) {
          continue;
        }
        if (!menuLinks.includes(link)) {
          menuLinks.push(link);
        }
      }
    }

    return NextResponse.json({
      success: true,
      website,
      pricesFound: uniquePrices,
      menuLinks: menuLinks.slice(0, 5),
      note: "Basic extraction. For better results, ensure Tavily API is configured.",
    });
  } catch (error) {
    console.error("Menu scrape error:", error);
    return NextResponse.json({ error: "Failed to scrape menu", details: String(error) }, { status: 500 });
  }
}
