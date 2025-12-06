import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    // Use Tavily API for web search (or you can use SerpAPI, Brave Search, etc.)
    const tavilyKey = process.env.TAVILY_API_KEY;

    if (tavilyKey) {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          search_depth: "basic",
          max_results: 5,
        }),
      });

      const data = await response.json();

      if (data.results) {
        return NextResponse.json({
          success: true,
          query,
          results: data.results.map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.content?.substring(0, 200) + "...",
          })),
        });
      }
    }

    // Fallback: Use DuckDuckGo instant answer API (free, no key needed)
    const ddgResponse = await fetch(
      `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1`
    );
    const ddgData = await ddgResponse.json();

    const results = [];

    if (ddgData.AbstractText) {
      results.push({
        title: ddgData.Heading || query,
        url: ddgData.AbstractURL || "",
        snippet: ddgData.AbstractText,
      });
    }

    if (ddgData.RelatedTopics) {
      for (const topic of ddgData.RelatedTopics.slice(0, 4)) {
        if (topic.Text) {
          results.push({
            title: topic.Text.split(" - ")[0] || topic.Text.substring(0, 50),
            url: topic.FirstURL || "",
            snippet: topic.Text,
          });
        }
      }
    }

    if (results.length === 0) {
      results.push({
        title: `Search results for "${query}"`,
        snippet: `Web search completed for: ${query}. For more detailed results, add a TAVILY_API_KEY to your environment.`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
      });
    }

    return NextResponse.json({
      success: true,
      query,
      results,
    });
  } catch (error) {
    console.error("Web search error:", error);
    return NextResponse.json(
      { error: "Search failed", details: String(error) },
      { status: 500 }
    );
  }
}
