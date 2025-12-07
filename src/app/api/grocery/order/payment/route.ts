import { NextRequest, NextResponse } from "next/server";

const MEALME_API_KEY = process.env.MEALME_API_KEY;
const MEALME_BASE_URL = "https://api.satsuma.ai";

// Get payment link for an order (GoPuff as Merchant of Record)
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
    const response = await fetch(`${MEALME_BASE_URL}/order/${orderId}/payment-link`, {
      headers: {
        Authorization: MEALME_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to get payment link", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      paymentLink: data.data?.url || data.url || data.payment_link,
      paymentData: data,
      message: "Payment link generated. Complete payment to start delivery.",
    });
  } catch (error) {
    console.error("Get payment link error:", error);
    return NextResponse.json(
      { error: "Failed to get payment link", details: String(error) },
      { status: 500 }
    );
  }
}

// Get payment intent for an order
export async function POST(request: NextRequest) {
  if (!MEALME_API_KEY) {
    return NextResponse.json(
      { error: "MealMe API key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 }
      );
    }

    const response = await fetch(`${MEALME_BASE_URL}/order/${orderId}/payment-intent`, {
      headers: {
        Authorization: MEALME_API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "Failed to get payment intent", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId,
      paymentIntent: data,
    });
  } catch (error) {
    console.error("Get payment intent error:", error);
    return NextResponse.json(
      { error: "Failed to get payment intent", details: String(error) },
      { status: 500 }
    );
  }
}
