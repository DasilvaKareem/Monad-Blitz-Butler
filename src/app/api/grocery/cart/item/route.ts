import { NextRequest, NextResponse } from "next/server";

const MEALME_API_KEY = process.env.MEALME_API_KEY;
const MEALME_BASE_URL = "https://api.satsuma.ai";

// Add item to cart
export async function POST(request: NextRequest) {
  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { cart_id, product_id, product_name, quantity } = body;

    if (!cart_id || !product_id) {
      return NextResponse.json(
        { error: "cart_id and product_id are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${MEALME_BASE_URL}/cart/${cart_id}/item`, {
      method: "POST",
      headers: {
        Authorization: MEALME_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        product_id,
        product_name: product_name || "Product",
        quantity: quantity || 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to add item to cart", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      item: data,
      message: `Added ${quantity || 1}x ${product_name || product_id} to cart`,
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { error: "Failed to add item to cart", details: String(error) },
      { status: 500 }
    );
  }
}

// Update item quantity
export async function PUT(request: NextRequest) {
  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { cart_id, item_id, quantity } = body;

    if (!cart_id || !item_id) {
      return NextResponse.json(
        { error: "cart_id and item_id are required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${MEALME_BASE_URL}/cart/${cart_id}/item/${item_id}`, {
      method: "PUT",
      headers: {
        Authorization: MEALME_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quantity: quantity || 1,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to update item", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      item: data,
      message: `Updated quantity to ${quantity}`,
    });
  } catch (error) {
    console.error("Update cart item error:", error);
    return NextResponse.json(
      { error: "Failed to update item", details: String(error) },
      { status: 500 }
    );
  }
}

// Remove item from cart
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const cart_id = searchParams.get("cart_id");
  const item_id = searchParams.get("item_id");

  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  if (!cart_id || !item_id) {
    return NextResponse.json(
      { error: "cart_id and item_id are required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${MEALME_BASE_URL}/cart/${cart_id}/item/${item_id}`, {
      method: "DELETE",
      headers: {
        Authorization: MEALME_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to remove item", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Remove cart item error:", error);
    return NextResponse.json(
      { error: "Failed to remove item", details: String(error) },
      { status: 500 }
    );
  }
}
