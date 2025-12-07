import { NextRequest, NextResponse } from "next/server";

const MEALME_API_KEY = process.env.MEALME_API_KEY;
const MEALME_BASE_URL = "https://api.satsuma.ai";

// Create a new cart
export async function POST(request: NextRequest) {
  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { location_id, user_id } = body;

    if (!location_id) {
      return NextResponse.json(
        { error: "location_id is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${MEALME_BASE_URL}/cart`, {
      method: "POST",
      headers: {
        Authorization: MEALME_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location_id,
        user_id: user_id || `user_${Date.now()}`,
        status: "Active",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to create cart", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      cartId: data.data || data.id || data.cart_id,
      cart: data,
    });
  } catch (error) {
    console.error("Create cart error:", error);
    return NextResponse.json(
      { error: "Failed to create cart", details: String(error) },
      { status: 500 }
    );
  }
}

// Get cart details
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cartId = searchParams.get("cartId");

  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  if (!cartId) {
    return NextResponse.json(
      { error: "cartId is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${MEALME_BASE_URL}/cart/${cartId}`, {
      headers: {
        Authorization: MEALME_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to get cart", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      cart: data,
    });
  } catch (error) {
    console.error("Get cart error:", error);
    return NextResponse.json(
      { error: "Failed to get cart", details: String(error) },
      { status: 500 }
    );
  }
}
