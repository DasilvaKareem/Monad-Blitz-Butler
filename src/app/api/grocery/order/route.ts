import { NextRequest, NextResponse } from "next/server";

const MEALME_API_KEY = process.env.MEALME_API_KEY;
const MEALME_BASE_URL = "https://api.satsuma.ai";

// Create a new order
export async function POST(request: NextRequest) {
  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const {
      location_id,
      items,
      customer,
      fulfillment_method = "Delivery",
      dropoff_instructions,
      tip,
    } = body;

    if (!location_id || !items || !customer) {
      return NextResponse.json(
        { error: "location_id, items, and customer are required" },
        { status: 400 }
      );
    }

    // Validate customer object
    if (!customer.name || !customer.address) {
      return NextResponse.json(
        { error: "customer.name and customer.address are required" },
        { status: 400 }
      );
    }

    const orderPayload: any = {
      location_id,
      fulfillment_method,
      customer: {
        id: customer.id || `user_${Date.now()}`,
        name: customer.name,
        email: customer.email,
        phone_number: customer.phone_number,
        address: {
          street_address: customer.address.street_address,
          street_address_detail: customer.address.street_address_detail || "",
          city: customer.address.city,
          region: customer.address.region || customer.address.state,
          postal_code: customer.address.postal_code || customer.address.zip,
          country: customer.address.country || "US",
        },
      },
      items: items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity || 1,
      })),
    };

    if (dropoff_instructions) {
      orderPayload.dropoff_instructions = dropoff_instructions;
    }

    if (tip) {
      orderPayload.tip = Math.round(tip * 100); // Convert to cents
    }

    console.log("Creating GoPuff order:", JSON.stringify(orderPayload, null, 2));

    const response = await fetch(`${MEALME_BASE_URL}/order`, {
      method: "POST",
      headers: {
        Authorization: MEALME_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Order creation failed:", data);
      return NextResponse.json(
        { error: data.message || "Failed to create order", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.data?.id || data.id || data.order_id,
      order: data,
      message: "Order created successfully! Proceed to payment.",
    });
  } catch (error) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order", details: String(error) },
      { status: 500 }
    );
  }
}

// Get order status
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const orderId = searchParams.get("orderId");

  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  if (!orderId) {
    return NextResponse.json(
      { error: "orderId is required" },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(`${MEALME_BASE_URL}/order/${orderId}`, {
      headers: {
        Authorization: MEALME_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to get order", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      order: data,
    });
  } catch (error) {
    console.error("Get order error:", error);
    return NextResponse.json(
      { error: "Failed to get order", details: String(error) },
      { status: 500 }
    );
  }
}
