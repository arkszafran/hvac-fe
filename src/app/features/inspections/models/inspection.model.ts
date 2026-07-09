export type InspectionSource = 'auto' | 'manual';

export type InspectionStatus =
  | 'new'
  | 'reminder_sent'
  | 'customer_confirmed'
  | 'customer_not_confirmed'
  | 'scheduled'
  | 'completed'
  | 'cancelled';

export interface Inspection {
  id: string;
  customerId: string;
  deviceIds: string[];
  source: InspectionSource;
  status: InspectionStatus;
  inspectionDate: string;
  reminderSentAt: string;
  customerConfirmedAt: string;
  lastContactAt: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface InspectionCreateInput {
  customerId: string;
  deviceIds: string[];
  source?: InspectionSource;
  status?: InspectionStatus;
  inspectionDate?: string;
  note?: string;
  reminderSentAt?: string;
  customerConfirmedAt?: string;
  lastContactAt?: string;
}

export interface InspectionConflict {
  code: 'missing_device';
  messageKey: string;
}

export interface InspectionCandidate {
  inspection: Inspection;
  inspectionDateLabel: string;
}

export interface InspectionSummaryInput {
  status: InspectionStatus;
  inspectionDate: string;
  deviceCount: number;
}
