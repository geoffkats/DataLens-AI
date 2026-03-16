export interface SchemaMapping {
  originalHeader: string;
  mappedHeader: string;
  confidence: number;
}

export type Tab = 'dashboard' | 'table' | 'charts' | 'ai' | 'reports' | 'audit' | 'templates';
export type Role = 'General' | 'Accountant' | 'Manager' | 'Analyst' | 'Government';

export interface ColumnConfig {
  id: string;
  header: string;
  visible: boolean;
  type: 'text' | 'number' | 'date' | 'currency' | 'percentage';
  format?: string;
}

export interface AuditLog {
  timestamp: Date;
  action: string;
  details: string;
  user: string;
}

export interface CleaningStep {
  gate: string;
  description: string;
  count: number;
}

export interface RecoveryMetric {
  column: string;
  intent: string;
  status: 'Recovered' | 'Partial' | 'Lost';
  action: string;
  method?: string;
}

export interface PipelineResult {
  data: any[];
  cleaningSteps: CleaningStep[];
  metadataMap: RecoveryMetric[];
  schemaInsights: string;
}

export interface ChatAction {
  type: 'update_cell' | 'rename_column' | 'delete_column' | 'transform_data' | 'add_column';
  payload: any;
}
