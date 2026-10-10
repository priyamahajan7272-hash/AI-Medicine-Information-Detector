import { GoogleGenAI } from "@google/genai";

/**
 * Analyzes medicine packaging image using Google Gemini Vision API.
 * Strict student project scope: Information/reading tool only.
 * No medical advice or prescription recommendations.
 */
export async function analyzeMedicineImage(base64Image, mimeType = "image/jpeg", customApiKey = "") {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "Missing Google Gemini API key! Please add your key to the .env file (VITE_GEMINI_API_KEY) or enter it in the settings bar."
    );
  }

  const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

  const prompt = `
You are an optical reading and text extraction assistant for an educational student project ("AI Medicine Information Detector").
Your task is to inspect the packaging/strip/bottle in this image and extract verifiable printed information.

IMPORTANT SAFETY & SCOPE RULES:
- This is strictly an information/reading tool.
- DO NOT prescribe, recommend dosage, or suggest taking this medicine.
- DO NOT give personalized medical advice.

Please inspect the packaging and return ONLY a valid, raw JSON object (with NO markdown code fences, NO backticks, NO explanations before or after) with the following structure:
{
  "identified": true,
  "confidence": "High" | "Medium" | "Low",
  "medicineName": "Full brand name and salt/generic composition if visible (e.g. Paracetamol 500mg / Crocin)",
  "genericName": "Active salt or chemical name",
  "manufacturer": "Company or lab name printed, or 'Not visible'",
  "generalPurpose": "Objective, general factual purpose/use (e.g., 'Analgesic and antipyretic commonly used for fever and mild to moderate pain relief')",
  "basicPrecautions": [
    "Precautions or warnings typically printed on the label (e.g., Store below 25°C, Do not exceed recommended dose, Keep out of reach of children)"
  ],
  "expiryDate": "Extracted expiry date formatted or verbatim from package, e.g. '08/2026' or 'Not readable/Not visible'",
  "expiryStatus": "Valid" | "Expiring Soon" | "Expired" | "Unknown",
  "batchNumber": "Batch or lot number if printed, or 'Not visible'",
  "rawExtractedText": "Key readable text fragments found on the packaging"
}

If the image is completely unreadable, blurry, or not a medicine package, return:
{
  "identified": false,
  "confidence": "Low",
  "medicineName": "Unknown / Unclear",
  "genericName": "N/A",
  "manufacturer": "N/A",
  "generalPurpose": "Unable to read clear medicine details from the packaging.",
  "basicPrecautions": ["Ensure proper lighting, place package flat and close to camera."],
  "expiryDate": "Not readable",
  "expiryStatus": "Unknown",
  "batchNumber": "N/A",
  "rawExtractedText": "Text could not be clearly recognized"
}
`;

  try {
    const cleanBase64 = base64Image.includes(",")
      ? base64Image.split(",")[1]
      : base64Image;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: cleanBase64,
                mimeType: mimeType || "image/jpeg",
              },
            },
          ],
        },
      ],
    });

    const responseText = response.text ? response.text.trim() : "";

    // Clean JSON response if enclosed in markdown blocks
    const cleanedJsonStr = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJsonStr);
    return parsed;
  } catch (error) {
    console.error("Gemini Vision analysis error:", error);
    throw error;
  }
}
