import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      return NextResponse.json(
        { error: "OpenAI API key not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/realtime/sessions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2025-06-03",
        }),
      }
    );

    const data = await response.json();

    // Check if OpenAI returned an error
    if (!response.ok) {
      console.error("OpenAI API error:", response.status, data);
      return NextResponse.json(
        {
          error: data.error?.message || "Failed to create session",
          details: data
        },
        { status: response.status }
      );
    }

    // Validate the response has the expected structure
    if (!data.client_secret?.value) {
      console.error("Invalid session response - missing client_secret:", data);
      return NextResponse.json(
        { error: "Invalid session response from OpenAI" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error in /session:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(error) },
      { status: 500 }
    );
  }
}
