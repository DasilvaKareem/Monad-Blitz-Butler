import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

// DoorDash Drive API credentials (Sandbox)
const DOORDASH_DEVELOPER_ID = process.env.DOORDASH_DEVELOPER_ID;
const DOORDASH_KEY_ID = process.env.DOORDASH_KEY_ID;
const DOORDASH_SIGNING_SECRET = process.env.DOORDASH_SIGNING_SECRET;

const DOORDASH_API_BASE = "https://openapi.doordash.com/drive/v2";

/**
 * Generate a DoorDash JWT for API authentication
 */
function generateDoorDashJWT(): string {
  if (!DOORDASH_DEVELOPER_ID || !DOORDASH_KEY_ID || !DOORDASH_SIGNING_SECRET) {
    throw new Error("DoorDash credentials not configured");
  }

  const payload = {
    aud: "doordash",
    iss: DOORDASH_DEVELOPER_ID,
    kid: DOORDASH_KEY_ID,
    exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
    iat: Math.floor(Date.now() / 1000),
  };

  const token = jwt.sign(
    payload,
    Buffer.from(DOORDASH_SIGNING_SECRET, "base64"),
    {
      algorithm: "HS256",
      header: {
        alg: "HS256",
        typ: "JWT",
        "dd-ver": "DD-JWT-V1",
      } as jwt.JwtHeader,
    }
  );

  return token;
}

interface DeliveryRequest {
  // Pickup details
  pickupAddress: string;
  pickupBusinessName: string;
  pickupPhoneNumber: string;
  pickupInstructions?: string;

  // Dropoff details
  dropoffAddress: string;
  dropoffBusinessName?: string;
  dropoffPhoneNumber: string;
  dropoffInstructions?: string;

  // Order details
  orderValue: number; // in cents
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;

  // Optional tip
  tip?: number; // in cents
}

/**
 * POST - Create a new delivery
 */
export async function POST(request: NextRequest) {
  try {
    const body: DeliveryRequest = await request.json();

    // Validate required fields
    if (!body.pickupAddress || !body.dropoffAddress) {
      return NextResponse.json(
        { error: "Missing pickup or dropoff address" },
        { status: 400 }
      );
    }

    if (!body.pickupPhoneNumber || !body.dropoffPhoneNumber) {
      return NextResponse.json(
        { error: "Missing pickup or dropoff phone number" },
        { status: 400 }
      );
    }

    if (!DOORDASH_DEVELOPER_ID || !DOORDASH_KEY_ID || !DOORDASH_SIGNING_SECRET) {
      return NextResponse.json(
        { error: "DoorDash API credentials not configured" },
        { status: 500 }
      );
    }

    const token = generateDoorDashJWT();
    const externalDeliveryId = `delivery-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚗 DOORDASH DELIVERY REQUEST");
    console.log(`   External ID: ${externalDeliveryId}`);
    console.log(`   Pickup: ${body.pickupBusinessName} - ${body.pickupAddress}`);
    console.log(`   Dropoff: ${body.dropoffAddress}`);
    console.log(`   Order Value: $${(body.orderValue / 100).toFixed(2)}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    const deliveryPayload = {
      external_delivery_id: externalDeliveryId,
      pickup_address: body.pickupAddress,
      pickup_business_name: body.pickupBusinessName,
      pickup_phone_number: body.pickupPhoneNumber,
      pickup_instructions: body.pickupInstructions || "",
      dropoff_address: body.dropoffAddress,
      dropoff_business_name: body.dropoffBusinessName || "Customer",
      dropoff_phone_number: body.dropoffPhoneNumber,
      dropoff_instructions: body.dropoffInstructions || "",
      order_value: body.orderValue,
      tip: body.tip || 0,
    };

    const response = await fetch(`${DOORDASH_API_BASE}/deliveries`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(deliveryPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("DoorDash API error:", data);
      return NextResponse.json(
        {
          error: "Failed to create delivery",
          details: data,
          code: data.code,
          message: data.message,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      deliveryId: data.external_delivery_id,
      trackingUrl: data.tracking_url,
      status: data.delivery_status,
      fee: data.fee,
      currency: data.currency,
      estimatedPickupTime: data.pickup_time_estimated,
      estimatedDropoffTime: data.dropoff_time_estimated,
      supportReference: data.support_reference,
      message: `Delivery created successfully! Track at: ${data.tracking_url}`,
    });
  } catch (error) {
    console.error("DoorDash delivery error:", error);
    return NextResponse.json(
      { error: "Failed to create delivery", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET - Get delivery status by external_delivery_id
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deliveryId = searchParams.get("deliveryId");

  if (!deliveryId) {
    return NextResponse.json(
      { error: "Missing deliveryId parameter" },
      { status: 400 }
    );
  }

  if (!DOORDASH_DEVELOPER_ID || !DOORDASH_KEY_ID || !DOORDASH_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "DoorDash API credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const token = generateDoorDashJWT();

    const response = await fetch(
      `${DOORDASH_API_BASE}/deliveries/${deliveryId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get delivery status", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      deliveryId: data.external_delivery_id,
      status: data.delivery_status,
      trackingUrl: data.tracking_url,
      fee: data.fee,
      currency: data.currency,
      estimatedPickupTime: data.pickup_time_estimated,
      estimatedDropoffTime: data.dropoff_time_estimated,
      actualPickupTime: data.pickup_time_actual,
      actualDropoffTime: data.dropoff_time_actual,
      dasherName: data.dasher_name,
      dasherPhoneNumber: data.dasher_dropoff_phone_number,
      supportReference: data.support_reference,
    });
  } catch (error) {
    console.error("DoorDash status error:", error);
    return NextResponse.json(
      { error: "Failed to get delivery status", details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Cancel a delivery
 */
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const deliveryId = searchParams.get("deliveryId");

  if (!deliveryId) {
    return NextResponse.json(
      { error: "Missing deliveryId parameter" },
      { status: 400 }
    );
  }

  if (!DOORDASH_DEVELOPER_ID || !DOORDASH_KEY_ID || !DOORDASH_SIGNING_SECRET) {
    return NextResponse.json(
      { error: "DoorDash API credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const token = generateDoorDashJWT();

    const response = await fetch(
      `${DOORDASH_API_BASE}/deliveries/${deliveryId}/cancel`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to cancel delivery", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      deliveryId: data.external_delivery_id,
      status: data.delivery_status,
      message: "Delivery cancelled successfully",
    });
  } catch (error) {
    console.error("DoorDash cancel error:", error);
    return NextResponse.json(
      { error: "Failed to cancel delivery", details: String(error) },
      { status: 500 }
    );
  }
}
