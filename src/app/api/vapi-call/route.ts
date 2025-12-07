import { NextRequest, NextResponse } from "next/server";

const VAPI_SECRET_KEY = process.env.VAPI_SECRET_KEY;

// Demo mode: forward all calls to admin number for testing
const DEMO_MODE = true;
const ADMIN_PHONE_NUMBER = "+16156058530";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, businessName, message } = body;

    if (!phoneNumber) {
      return NextResponse.json({ error: "Missing phone number" }, { status: 400 });
    }

    if (!VAPI_SECRET_KEY) {
      return NextResponse.json({ error: "Vapi API key not configured" }, { status: 500 });
    }

    // In demo mode, route to admin number but show original target
    const actualCallNumber = DEMO_MODE ? ADMIN_PHONE_NUMBER : phoneNumber;

    // Log the call for visibility
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📞 VAPI CALL INITIATED");
    if (DEMO_MODE) {
      console.log("   ⚠️  DEMO MODE - Forwarding to admin");
      console.log(`   Target: ${phoneNumber} (${businessName || "Unknown"})`);
      console.log(`   Actual: ${ADMIN_PHONE_NUMBER} (Admin)`);
    } else {
      console.log(`   Phone: ${phoneNumber}`);
      console.log(`   Business: ${businessName || "Unknown"}`);
    }
    console.log(`   Purpose: ${message}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Create an outbound call using Vapi API
    const response = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        phoneNumberId: undefined, // Will use default
        customer: {
          number: actualCallNumber,
          name: "Customer",
        },
        assistant: {
          name: "Blitz Butler",
          voice: {
            provider: "11labs",
            voiceId: "21m00Tcm4TlvDq8ikWAM", // Rachel voice
          },
          model: {
            provider: "openai",
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: `You are Blitz Butler, an AI assistant making a call on behalf of a customer.
You are calling ${businessName || "a business"}.

Your task: ${message || "Ask about their hours and availability."}

Be polite, professional, and concise. Introduce yourself as calling on behalf of a customer.
If they ask questions you can't answer, politely say you'll have your customer get back to them.
Keep the call brief and focused on the task.`,
              },
            ],
          },
          firstMessage: `Hello, this is Blitz Butler calling on behalf of a customer. ${message || "I was hoping to get some information."}`,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Vapi API error:", data);
      return NextResponse.json(
        { error: "Failed to initiate call", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      callId: data.id,
      status: data.status,
      phoneNumber,
      businessName,
      demoMode: DEMO_MODE,
      message: DEMO_MODE
        ? `🧪 TEST MODE: Call forwarded to admin number. Would have called ${businessName || phoneNumber} at ${phoneNumber}.`
        : `Call initiated to ${businessName || phoneNumber}`,
    });
  } catch (error) {
    console.error("Vapi call error:", error);
    return NextResponse.json(
      { error: "Failed to make call", details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const callId = searchParams.get("callId");

  if (!callId) {
    return NextResponse.json({ error: "Missing callId parameter" }, { status: 400 });
  }

  if (!VAPI_SECRET_KEY) {
    return NextResponse.json({ error: "Vapi API key not configured" }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
      headers: {
        "Authorization": `Bearer ${VAPI_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get call status", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      callId: data.id,
      status: data.status,
      duration: data.duration,
      transcript: data.transcript,
      summary: data.summary,
    });
  } catch (error) {
    console.error("Vapi status error:", error);
    return NextResponse.json(
      { error: "Failed to get call status", details: String(error) },
      { status: 500 }
    );
  }
}
