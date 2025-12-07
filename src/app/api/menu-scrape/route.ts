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

        // Extract image URLs from content
        const imagePattern = /(https?:\/\/[^\s"']+\.(?:jpg|jpeg|png|webp|gif)(?:\?[^\s"']*)?)/gi;
        const imageUrls = content.match(imagePattern) || [];

        // Filter for food-related images (avoid icons, logos, etc.)
        const foodImages = imageUrls.filter((url: string) => {
          const lowerUrl = url.toLowerCase();
          // Exclude common non-food images
          if (lowerUrl.includes('logo') || lowerUrl.includes('icon') || lowerUrl.includes('avatar')) {
            return false;
          }
          // Prefer larger images (often have size in URL)
          if (lowerUrl.includes('thumb') || lowerUrl.includes('small') || lowerUrl.includes('tiny')) {
            return false;
          }
          return true;
        }).slice(0, 6);

        return NextResponse.json({
          success: true,
          website,
          menuItems: menuItems.length > 0 ? menuItems : null,
          pricesFound: uniquePrices,
          foodCategories: [...new Set(foundCategories)],
          menuLinks: [...new Set(menuLinks)].slice(0, 5),
          images: foodImages.length > 0 ? [...new Set(foodImages)] : null,
          mainImage: foodImages[0] || null,
          rawContentPreview: content.substring(0, 500) + "...",
          note: menuItems.length > 0
            ? `Found ${menuItems.length} menu items with prices${foodImages.length > 0 ? ` and ${foodImages.length} images` : ''}.`
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

    // Extract image URLs from HTML
    const imgPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const images: string[] = [];
    let imgMatch;
    while ((imgMatch = imgPattern.exec(html)) !== null && images.length < 6) {
      let imgUrl = imgMatch[1];
      // Skip tiny images, icons, logos
      if (imgUrl.includes('logo') || imgUrl.includes('icon') || imgUrl.includes('1x1') || imgUrl.includes('pixel')) {
        continue;
      }
      // Make relative URLs absolute
      if (imgUrl.startsWith('/')) {
        const url = new URL(website);
        imgUrl = `${url.origin}${imgUrl}`;
      } else if (!imgUrl.startsWith('http')) {
        continue;
      }
      if (!images.includes(imgUrl)) {
        images.push(imgUrl);
      }
    }

    return NextResponse.json({
      success: true,
      website,
      pricesFound: uniquePrices,
      menuLinks: menuLinks.slice(0, 5),
      images: images.length > 0 ? images : null,
      mainImage: images[0] || null,
      note: "Basic extraction. For better results, ensure Tavily API is configured.",
    });
  } catch (error) {
    console.error("Menu scrape error:", error);
    return NextResponse.json({ error: "Failed to scrape menu", details: String(error) }, { status: 500 });
  }
}
