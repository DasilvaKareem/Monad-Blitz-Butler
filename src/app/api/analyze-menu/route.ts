import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: "Either imageUrl or imageBase64 is required" },
        { status: 400 }
      );
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔍 ANALYZING MENU IMAGE WITH VISION");
    console.log(`   Source: ${imageUrl ? "URL" : "Base64"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Build the image content based on input type
    const imageContent = imageUrl
      ? { type: "image_url" as const, image_url: { url: imageUrl, detail: "high" as const } }
      : { type: "image_url" as const, image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: "high" as const } };

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a menu analysis expert. Extract all menu items with their prices from the image.

Return a JSON object with this exact structure:
{
  "restaurantName": "Name if visible, or null",
  "menuItems": [
    {
      "name": "Item name",
      "description": "Brief description if available",
      "price": 12.99,
      "category": "Appetizers/Entrees/Drinks/Desserts/etc"
    }
  ],
  "categories": ["list", "of", "categories", "found"],
  "currency": "USD",
  "notes": "Any special notes like happy hour prices, combo deals, etc"
}

Be thorough - extract EVERY item you can see with its price. If price is unclear, estimate based on context or mark as null.`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Please analyze this menu image and extract all items with their prices. Return valid JSON only.",
            },
            imageContent,
          ],
        },
      ],
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "No response from vision API" },
        { status: 500 }
      );
    }

    let parsedMenu;
    try {
      parsedMenu = JSON.parse(content);
    } catch {
      parsedMenu = { raw: content, parseError: true };
    }

    console.log(`✅ Found ${parsedMenu.menuItems?.length || 0} menu items`);

    return NextResponse.json({
      success: true,
      ...parsedMenu,
      itemCount: parsedMenu.menuItems?.length || 0,
    });
  } catch (error) {
    console.error("Menu analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze menu", details: String(error) },
      { status: 500 }
    );
  }
}
