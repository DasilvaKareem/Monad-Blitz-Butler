import { NextRequest, NextResponse } from "next/server";

const MEALME_API_KEY = process.env.MEALME_API_KEY;
const MEALME_BASE_URL = "https://api.satsuma.ai";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("query") || "";
  const latitude = searchParams.get("latitude") || searchParams.get("lat");
  const longitude = searchParams.get("longitude") || searchParams.get("lng");
  const distance = searchParams.get("distance") || "10mi";
  const category = searchParams.get("category");

  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  if (!latitude || !longitude) {
    return NextResponse.json(
      { error: "Location (latitude, longitude) is required" },
      { status: 400 }
    );
  }

  try {
    const params = new URLSearchParams({
      query,
      latitude,
      longitude,
      distance,
    });

    if (category) {
      params.append("category", category);
    }

    const response = await fetch(`${MEALME_BASE_URL}/product?${params}`, {
      headers: {
        Authorization: MEALME_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to search products", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      query,
      products: data.data || data.products || data,
      location: { latitude, longitude },
    });
  } catch (error) {
    console.error("MealMe search error:", error);
    return NextResponse.json(
      { error: "Failed to search products", details: String(error) },
      { status: 500 }
    );
  }
}
