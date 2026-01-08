
import { GoogleGenAI } from "@google/genai";

/**
 * Generates actionable waste management insights using the Gemini API.
 * Adheres strictly to the Google GenAI SDK guidelines for initialization and usage.
 */
export const getWasteInsights = async (surveyData: any[], auditData: any[]) => {
  // Fix: Initialize GoogleGenAI directly using process.env.API_KEY as required.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the following waste management survey and audit data for Mattuthavani Market, Madurai.
    Provide 3 actionable insights for the administration to improve waste management.
    Focus on:
    1. Segregation efficiency
    2. High-waste generating clusters
    3. Health & safety improvements

    Data Summary:
    Total Surveys: ${surveyData.length}
    Total Audits: ${auditData.length}
    
    Return the response as a clear, professional bulleted list in Markdown.
  `;

  try {
    // Fix: Using 'gemini-3-pro-preview' as this task involves complex reasoning and data analysis.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    
    // Fix: Accessing the .text property directly. Added fallback '??' to ensure string return type, preventing TS2345 error.
    return response.text ?? "No insights generated.";
  } catch (error) {
    console.error("Gemini Insight Generation Error:", error);
    return "Unable to generate insights at this time. Please review the raw dashboard data for manual analysis.";
  }
};
