import { GoogleGenAI } from "@google/genai";

/**
 * Checks if an error from Gemini API represents an expired, invalid, or exhausted API key.
 */
export function isApiKeyExpiredOrInvalid(error) {
  if (!error) return false;
  const msg = (error.message || "").toLowerCase();
  const status = error.status || error.statusCode || "";

  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 429 ||
    msg.includes("api_key_invalid") ||
    msg.includes("api key not valid") ||
    msg.includes("api key expired") ||
    msg.includes("permission_denied") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota exceeded") ||
    msg.includes("rate limit") ||
    msg.includes("unauthenticated")
  );
}

/**
 * Analyzes medicine packaging image using Google Gemini Vision API.
 * Strict student project scope: Information/reading tool only.
 * No medical advice or prescription recommendations.
 */
export async function analyzeMedicineImage(base64Image, mimeType = "image/jpeg", customApiKey = "") {
  const apiKey = (customApiKey || import.meta.env.VITE_GEMINI_API_KEY || "").trim();

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    const err = new Error("NO_API_KEY");
    err.isKeyIssue = true;
    throw err;
  }

  const ai = new GoogleGenAI({ apiKey });

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

    // Models in priority order: gemini-3.8-flash, with 2.0-flash and 1.5-flash as fallbacks
    const candidateModels = ["gemini-3.8-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
    let response = null;
    let lastErr = null;

    for (const modelName of candidateModels) {
      let attempts = 0;
      const maxAttempts = 2;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          response = await ai.models.generateContent({
            model: modelName,
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
          if (response) break;
        } catch (err) {
          lastErr = err;
          const status = err.status || (err.error && err.error.code);
          const errMsg = (err.message || "").toLowerCase();

          // 503 High Demand / UNAVAILABLE: brief pause & retry once, else fallback to next model
          if (status === 503 || errMsg.includes("high demand") || errMsg.includes("unavailable")) {
            console.warn(`Model ${modelName} experiencing high demand (503). Retrying or falling back...`);
            if (attempts < maxAttempts) {
              await new Promise((resolve) => setTimeout(resolve, 1500));
              continue;
            }
          }
          // If model not found or still failing, move to next model in list
          break;
        }
      }

      if (response) break;
    }

    if (!response) {
      throw lastErr || new Error("All Gemini models are currently experiencing high demand. Please retry in a few moments.");
    }

    const responseText = response.text ? response.text.trim() : "";

    // Clean JSON response if enclosed in markdown blocks
    const cleanedJsonStr = responseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanedJsonStr);
    return parsed;
  } catch (error) {
    if (isApiKeyExpiredOrInvalid(error)) {
      error.isKeyIssue = true;
    }
    console.error("Gemini Vision analysis error:", error);
    throw error;
  }
}
