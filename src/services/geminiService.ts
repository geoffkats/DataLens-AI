import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface DataInsight {
  type: 'anomaly' | 'suggestion' | 'prediction' | 'summary';
  title: string;
  description: string;
  actionable?: boolean;
}

export const analyzeData = async (data: any[]): Promise<string> => {
  const sampleData = data.slice(0, 50); // Send a sample to avoid token limits
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this dataset sample and provide a comprehensive report. 
    Include:
    1. Data quality assessment (missing values, anomalies).
    2. Key trends and patterns.
    3. Predictive insights (what might happen next based on these numbers).
    4. Suggestions for cleaning.
    
    Data Sample (JSON):
    ${JSON.stringify(sampleData)}`,
  });

  return response.text || "No analysis generated.";
};

export const suggestCleaning = async (data: any[]): Promise<any> => {
  const sampleData = data.slice(0, 20);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Look at this data sample and return a JSON object representing cleaning steps.
    Identify columns with nulls and suggest what to replace them with (e.g., mean, median, or a specific value based on context).
    Identify potential anomalies.
    
    Data Sample:
    ${JSON.stringify(sampleData)}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          cleaningSteps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                column: { type: Type.STRING },
                issue: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                replacementValue: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"cleaningSteps": []}');
};

export const generateChartTitle = async (xAxis: string, yAxis: string, role: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest a professional and descriptive title for a chart where the X-axis is "${xAxis}" and the Y-axis is "${yAxis}". The user's role is "${role}". Return only the title string, nothing else.`,
  });

  return response.text?.trim() || `${yAxis} by ${xAxis}`;
};
