"use server";

import { API_KEY } from "@/utils/keys";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

export interface ScannedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface ScanResult {
  items: ScannedItem[];
  subtotal: number;
  delivery: number;
  tax: number;
  service: number;
  total: number;
}

export async function scanReceipt(
  formData: FormData,
): Promise<ScanResult | null> {
  console.log("--- Server Action: scanReceipt Started ---");

  console.log("API Key present:", !!API_KEY, "Length:", API_KEY?.length);

  if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY environment variable");
    throw new Error("Server configuration error: Missing API Key");
  }

  const file = formData.get("file") as File;

  if (!file) {
    console.error("No file provided in FormData");
    return null;
  }

  console.log(
    "File received:",
    file.name,
    "Size:",
    file.size,
    "Type:",
    file.type,
  );

  const bytes = await file.arrayBuffer();
  const base64Data = Buffer.from(bytes).toString("base64");

  const prompt = `
    Analyze this receipt image and extract the following details in strict JSON format:
    1. List of individual items ordered (name, price, quantity). 
       - IMPORTANT: If an item has a quantity > 1 (e.g., "x6", "qty 6", "6 wings"), YOU MUST return X SEPARATE entries for that item.
       - Example: "2x Burger $20" (where $20 is total) -> Return TWO items: { "name": "Burger", "price": 10.00, "quantity": 1 }, { "name": "Burger", "price": 10.00, "quantity": 1 }
       - If the price listed is the UNIT price, preserve it. If it is the TOTAL price for the group, divide it by the quantity.
       - Basically, I want a FLAT list where every item has quantity 1.
    2. Delivery fee (if any).
    3. Tax amount.
    4. Service charge / Tip (if any).
    5. Subtotal and Total.

    Return ONLY raw JSON with this structure, no markdown:
    {
      "items": [{ "name": "Burger", "price": 10.50, "quantity": 1 }, { "name": "Burger", "price": 10.50, "quantity": 1 }],
      "delivery": 5.00,
      "tax": 2.50,
      "service": 3.00,
      "subtotal": 50.00,
      "total": 60.50
    }
  `;

  try {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // Clean up markdown code blocks if Gemini returns them
    const jsonString = text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const data = JSON.parse(jsonString);

    // Add IDs to items
    const itemsWithIds = data.items.map((item: any, index: number) => ({
      ...item,
      id: `scanned-${index}-${Date.now()}`,
    }));

    return {
      items: itemsWithIds,
      subtotal: data.subtotal || 0,
      delivery: data.delivery || 0,
      tax: data.tax || 0,
      service: data.service || 0,
      total: data.total || 0,
    };
  } catch (error: any) {
    console.error("Error scanning receipt:", error);

    let message = "Unknown error during AI scan";

    if (error.message) {
      if (error.message.includes("API key not valid") || error.message.includes("API_KEY_INVALID")) {
        message = "The Gemini API Key provided is invalid. Please check your utils/keys.ts file.";
      } else if (error.message.includes("quota")) {
        message = "AI scanning quota exceeded. Please try again later.";
      } else if (error.message.includes("network") || error.message.includes("fetch")) {
        message = "Network error. Please check your internet connection and try again.";
      } else {
        message = error.message;
      }
    }

    throw new Error(message);
  }
}
