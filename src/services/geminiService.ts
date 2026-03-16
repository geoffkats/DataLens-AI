import { GoogleGenAI, Type } from "@google/genai";
import { ColumnConfig, ChatAction, PipelineResult, RecoveryMetric, CleaningStep, SchemaMapping } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Gate 1: The Semantic Normalizer + Academic Drift (The "Fixer")
const semanticNormalize = async (data: any[]): Promise<any[]> => {
  const currentYear = 2026;
  const uniqueGrades = Array.from(new Set(data.map(d => String(d.grade || d.Grade || d.Class || d.normalized_grade || '')).filter(Boolean)));
  
  if (uniqueGrades.length === 0) return data;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Senior Data Engineer. 
    1. Map these messy grade strings to a Standard Schema: [P1, P2, P3, P4, P5, P6, P7, S1, S2, S3, S4, S5, S6, ALUMNI, GRADUATE, OTHER].
    2. Apply Temporal Logic: If a record's source suggests it is from a previous year (e.g. 2025) and the grade is S4, predict the 2026 grade as S5.
    
    Input Strings: ${JSON.stringify(uniqueGrades)}
    Current Year: ${currentYear}
    
    Return a JSON object where keys are original strings and values are an object: { standardized: string, predicted: string, isPredicted: boolean }.`,
    config: { responseMimeType: "application/json" }
  });

  const mapping = JSON.parse(response.text || '{}');
  return data.map(row => {
    const original = String(row.grade || row.Grade || row.Class || row.normalized_grade || '');
    const mapResult = mapping[original] || { standardized: 'OTHER', predicted: 'OTHER', isPredicted: false };
    return {
      ...row,
      normalized_grade: mapResult.standardized,
      predicted_grade: mapResult.predicted,
      grade_source: mapResult.isPredicted ? 'System-Predicted' : 'User-Entered'
    };
  });
};

// Gate 2: The Household Resolver (The "Linker")
const resolveHouseholds = (data: any[]): any[] => {
  const phoneMap = new Map<string, string>();
  let familyCounter = 1;

  return data.map(row => {
    const phone = String(row.phone_number || row.Phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 5) {
      return { 
        ...row, 
        family_id: `FAM-IND-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        student_id: `STU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
      };
    }

    if (!phoneMap.has(phone)) {
      phoneMap.set(phone, `FAM-${String(familyCounter++).padStart(4, '0')}`);
    }
    
    return {
      ...row,
      family_id: phoneMap.get(phone),
      student_id: `STU-${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    };
  });
};

// Gate 3: Forensic Recovery Gate (The "Doctor")
const forensicRecovery = async (data: any[]): Promise<{ data: any[], metrics: RecoveryMetric[] }> => {
  if (data.length === 0) return { data: [], metrics: [] };
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Forensic Data Auditor and Schema Reconstruction Specialist.
    Task: Heal this JSON array of student leads.
    
    STRATEGIES:
    1. GHOST COLUMN RECOVERY: If a value is '#REF!', do not delete. Analyze the header and surrounding row context to reconstruct the DNA of the column.
       - If header is 'Total_Fee' and 'Paid'/'Balance' exist, mark as RECOVERABLE_CALCULATION.
       - If header is unique but data is missing, flag as DATA_GAP_CRITICAL.
    2. TEMPORAL INFERENCE: If 'Age' is missing but 'Year_of_Birth' or 'Current_Grade' is present, use temporal logic to infer the missing data.
    3. CONTEXTUAL INTERPOLATION: Use patterns in the data to fill gaps.
    4. RANGE VALIDATION: If DOB is before 2005 or after 2022, set 'validation_flag' to 'INVALID_AGE'.
    5. JUNK STRIPPING: Remove junk characters from phone numbers (e.g., '???', '---', 'p'), format to E.164.
    
    Input Data: ${JSON.stringify(data.slice(0, 50))}
    
    Return a JSON object: { 
      cleanedData: Array, 
      recoveryMetrics: Array<{column: string, intent: string, status: string, action: string, method: string}> 
    }`,
    config: { responseMimeType: "application/json" }
  });

  const result = JSON.parse(response.text || '{"cleanedData": [], "recoveryMetrics": []}');
  return {
    data: result.cleanedData,
    metrics: result.recoveryMetrics
  };
};

// Gate 4: The Deduplication "Survivor" Logic (LIFO)
const deduplicateSurvivor = (data: any[]): any[] => {
  const unique = new Map<string, any>();
  
  // We assume the data array is already ordered by upload time (LIFO)
  // If not, we would sort by a timestamp field here.
  data.forEach(row => {
    const key = (row.email || row.phone_number || row.lead_name || '').toLowerCase();
    if (!key) return;

    if (unique.has(key)) {
      const existing = unique.get(key);
      // Survivor Logic: Keep most recent grade, most specific location/school, but preserve original contact info
      unique.set(key, {
        ...existing,
        ...row,
        normalized_grade: (row.normalized_grade && row.normalized_grade !== 'OTHER') ? row.normalized_grade : existing.normalized_grade,
        school_name: row.school_name || existing.school_name,
        _merged: true
      });
    } else {
      unique.set(key, row);
    }
  });

  return Array.from(unique.values());
};

export const analyzeDraftSchema = async (headers: string[]): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze these 80+ unique headers from 16 disparate files: ${headers.join(', ')}.
    Identify the 5 most important pieces of information we are currently failing to capture or standardize due to formatting errors.
    Explain WHY they are critical for a Ugandan Education CRM.`,
  });
  return response.text || "No schema insights available.";
};

export const runOrchestrationPipeline = async (data: any[]): Promise<PipelineResult> => {
  const steps: CleaningStep[] = [];
  
  try {
    // Pass 1: Semantic Normalization + Academic Drift
    let processed = await semanticNormalize(data);
    steps.push({ gate: "Fixer", description: "Standardized grades and applied Temporal Logic (Academic Drift)", count: data.length });

    // Pass 2: Household Resolution
    processed = resolveHouseholds(processed);
    steps.push({ gate: "Linker", description: "Resolved households via Parent Phone clusters (Family_ID)", count: processed.length });

    // Pass 3: Forensic Recovery
    const recoveryResult = await forensicRecovery(processed);
    processed = recoveryResult.data;
    steps.push({ gate: "Doctor", description: "Performed Forensic Recovery on #REF! columns and validated DOB ranges", count: processed.length });

    // Pass 4: Survivor Deduplication
    processed = deduplicateSurvivor(processed);
    steps.push({ gate: "Survivor", description: "Applied LIFO merging to resolve duplicate lead conflicts", count: processed.length });

    // Draft Schema Analysis for insights
    const allHeaders = Array.from(new Set(data.flatMap(d => Object.keys(d))));
    const schemaInsights = await analyzeDraftSchema(allHeaders);

    return {
      data: processed,
      cleaningSteps: steps,
      metadataMap: recoveryResult.metrics,
      schemaInsights
    };
  } catch (error) {
    console.error("Pipeline failed:", error);
    return { 
      data, 
      cleaningSteps: [{ gate: "Error", description: "Pipeline failed", count: 0 }],
      metadataMap: [],
      schemaInsights: ""
    };
  }
};

export const getSemanticSchemaMapping = async (headers: string[]): Promise<SchemaMapping[]> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Map these disparate CSV headers to a unified schema: [lead_name, phone_number, email, grade, source_campaign, status].
    
    Headers to map: ${headers.join(', ')}
    
    Return a JSON array of mappings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            originalHeader: { type: Type.STRING },
            mappedHeader: { type: Type.STRING },
            confidence: { type: Type.NUMBER }
          },
          required: ["originalHeader", "mappedHeader", "confidence"]
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const analyzeDataSwamp = async (data: any[]): Promise<string> => {
  const sample = data.slice(0, 20);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze this lead generation data sample. Identify:
    1. Duplicate patterns.
    2. Formatting inconsistencies.
    3. Potential "Data Rot" (stale leads).
    4. Recommendations for a "Golden Record" strategy.
    
    Data: ${JSON.stringify(sample)}`,
  });

  return response.text || "No analysis available.";
};

export const normalizeData = async (data: any[], fileName: string): Promise<any[]> => {
  const result = await runOrchestrationPipeline(data);
  return result.data;
};

export const applyCleaningStep = async (data: any[], step: any): Promise<any[]> => {
  return data.map(row => {
    const newRow = { ...row };
    if (step.column in newRow) {
      if (newRow[step.column] === null || newRow[step.column] === undefined || newRow[step.column] === '') {
        newRow[step.column] = step.replacementValue;
      }
    }
    return newRow;
  });
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

export const processChatCommand = async (
  command: string, 
  data: any[], 
  columns: ColumnConfig[]
): Promise<{ actions: ChatAction[], message: string }> => {
  const sampleData = data.slice(0, 10);
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Act as a Data Architect and Automation Specialist. 
    The user wants to manipulate their data via this command: "${command}"
    
    Current Columns: ${JSON.stringify(columns.map(c => ({ id: c.id, header: c.header })))}
    Data Sample: ${JSON.stringify(sampleData)}
    
    You can issue the following actions:
    1. { "type": "update_cell", "payload": { "rowId": number, "columnId": string, "value": any } }
    2. { "type": "rename_column", "payload": { "oldId": string, "newHeader": string } }
    3. { "type": "delete_column", "payload": { "columnId": string } }
    4. { "type": "transform_data", "payload": { "columnId": string, "logic": "description of logic" } }
    5. { "type": "add_column", "payload": { "header": string, "logic": "description of logic" } }
    
    Return a JSON object:
    {
      "actions": ChatAction[],
      "message": "A helpful response explaining what you are doing"
    }`,
    config: { responseMimeType: "application/json" }
  });

  return JSON.parse(response.text || '{"actions": [], "message": "I couldn\'t understand that command."}');
};

export const generateChartTitle = async (xAxis: string, yAxis: string, role: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Suggest a professional and descriptive title for a chart where the X-axis is "${xAxis}" and the Y-axis is "${yAxis}". The user's role is "${role}". Return only the title string, nothing else.`,
  });

  return response.text?.trim() || `${yAxis} by ${xAxis}`;
};
