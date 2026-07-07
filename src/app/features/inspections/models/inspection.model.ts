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
  targetDate: string;
  windowStart: string;
  windowEnd: string;
  plannedDate: string;
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
  note?: string;
  plannedDate?: string;
  reminderSentAt?: string;
  customerConfirmedAt?: string;
  lastContactAt?: string;
}

export interface InspectionConflict {
  code: 'missing_device' | 'device_not_eligible' | 'date_window';
  messageKey: string;
}

export interface InspectionCandidate {
  inspection: Inspection;
  targetDateLabel: string;
}

export interface InspectionSummaryInput {
  status: InspectionStatus;
  windowStart: string;
  windowEnd: string;
  plannedDate: string;
  deviceCount: number;
}
