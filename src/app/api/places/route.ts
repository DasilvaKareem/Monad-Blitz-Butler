import { NextRequest, NextResponse } from "next/server";

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const location = searchParams.get("location") || "40.7128,-74.0060"; // Default NYC
  const type = searchParams.get("type") || "restaurant";

  if (!query) {
    return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
  }

  try {
    // Try Google Places API first
    const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      query + " " + type
    )}&location=${location}&radius=5000&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    // If Google Places works, use it
    if (searchData.status === "OK" && searchData.results?.length > 0) {
      const places = await Promise.all(
        (searchData.results || []).slice(0, 5).map(async (place: any) => {
          // Get place details for website, phone, hours
          const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,price_level,rating,user_ratings_total,url,reviews&key=${GOOGLE_PLACES_API_KEY}`;

          const detailsResponse = await fetch(detailsUrl);
          const detailsData = await detailsResponse.json();
          const details = detailsData.result || {};

          return {
            name: place.name,
            address: place.formatted_address,
            rating: place.rating,
            totalRatings: place.user_ratings_total,
            priceLevel: place.price_level ? "$".repeat(place.price_level) : "N/A",
            isOpen: place.opening_hours?.open_now ?? null,
            phone: details.formatted_phone_number || null,
            website: details.website || null,
            googleMapsUrl: details.url || null,
            hours: details.opening_hours?.weekday_text || null,
            topReview: details.reviews?.[0]?.text?.substring(0, 150) + "..." || null,
          };
        })
      );

      return NextResponse.json({
        success: true,
        query,
        results: places,
      });
    }

    // Fallback: Use Tavily for restaurant search
    console.log("Google Places failed, falling back to Tavily:", searchData.status);

    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      const tavilyResponse = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          api_key: tavilyKey,
          query: `${query} restaurant menu address phone`,
          search_depth: "advanced",
          max_results: 5,
          include_domains: ["yelp.com", "tripadvisor.com", "doordash.com", "ubereats.com", "grubhub.com"],
        }),
      });

      const tavilyData = await tavilyResponse.json();

      if (tavilyData.results && tavilyData.results.length > 0) {
        const results = tavilyData.results.map((r: any) => ({
          name: r.title?.split(" - ")[0] || r.title?.split("|")[0] || r.title,
          address: r.content?.match(/\d+[^,]+,\s*[A-Z]{2}\s*\d{5}/)?.[0] || "See website for address",
          rating: r.content?.match(/(\d\.?\d?)\s*(?:stars?|rating)/i)?.[1] || null,
          website: r.url,
          description: r.content?.substring(0, 200) + "...",
          source: new URL(r.url).hostname,
        }));

        return NextResponse.json({
          success: true,
          query,
          results,
          note: "Results from Tavily web search.",
        });
      }
    }

    // Final fallback
    return NextResponse.json({
      success: true,
      query,
      results: [{
        name: `Search for "${query}"`,
        address: "Use the link below to search",
        website: `https://www.google.com/maps/search/${encodeURIComponent(query + " restaurant")}`,
        description: `Click to search for ${query} on Google Maps.`,
      }],
      note: "Configure Google Places API key without referrer restrictions for full results.",
    });
  } catch (error) {
    console.error("Places API error:", error);
    return NextResponse.json({ error: "Search failed", details: String(error) }, { status: 500 });
  }
}
