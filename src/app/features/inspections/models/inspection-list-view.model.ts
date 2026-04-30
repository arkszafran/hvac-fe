import { InspectionStatus } from './inspection.model';

export const INSPECTION_LIST_VIEW_QUERY_PARAM = 'view';

export type InspectionListViewId =
  | 'planned'
  | 'contact'
  | 'scheduled'
  | 'closed'
  | 'orphan-devices';

export interface InspectionListViewDefinition {
  id: InspectionListViewId;
  label: string;
  description: string;
  statuses: readonly InspectionStatus[];
  includesOrphanDevices?: boolean;
}

export const DEFAULT_INSPECTION_LIST_VIEW_ID: InspectionListViewId = 'contact';

export const INSPECTION_LIST_VIEWS: readonly InspectionListViewDefinition[] = [
  {
    id: 'planned',
    label: 'Planowane',
    description: 'Nowe przeglądy oraz przeglądy po wysłaniu przypomnienia.',
    statuses: ['new', 'reminder_sent'],
  },
  {
    id: 'contact',
    label: 'Do kontaktu',
    description: 'Przeglądy po reakcji klienta, wymagające dalszego kontaktu.',
    statuses: ['customer_confirmed', 'customer_not_confirmed'],
  },
  {
    id: 'scheduled',
    label: 'Umówione',
    description: 'Przeglądy z ustalonym terminem wykonania.',
    statuses: ['scheduled'],
  },
  {
    id: 'closed',
    label: 'Zakończone',
    description: 'Historia spraw zakończonych lub anulowanych.',
    statuses: ['completed', 'cancelled'],
  },
  {
    id: 'orphan-devices',
    label: 'Urządzenia bez przeglądu',
    description: 'Urządzenia kwalifikujące się do przeglądu, ale bez przypisanej sprawy.',
    statuses: [],
    includesOrphanDevices: true,
  },
];

export function parseInspectionListViewId(value: string | null | undefined): InspectionListViewId {
  return (
    INSPECTION_LIST_VIEWS.find((view) => view.id === value)?.id ?? DEFAULT_INSPECTION_LIST_VIEW_ID
  );
}

export function getInspectionListViewDefinition(
  viewId: InspectionListViewId,
): InspectionListViewDefinition {
  return (
    INSPECTION_LIST_VIEWS.find((view) => view.id === viewId) ??
    INSPECTION_LIST_VIEWS.find((view) => view.id === DEFAULT_INSPECTION_LIST_VIEW_ID)!
  );
}

export function matchesInspectionListView(
  status: InspectionStatus,
  viewId: InspectionListViewId,
): boolean {
  return getInspectionListViewDefinition(viewId).statuses.includes(status);
}

export function getInspectionListViewIdForStatus(status: InspectionStatus): InspectionListViewId {
  return (
    INSPECTION_LIST_VIEWS.find(
      (view) => !view.includesOrphanDevices && view.statuses.includes(status),
    )?.id ?? DEFAULT_INSPECTION_LIST_VIEW_ID
  );
}

export function buildInspectionListViewQueryParams(
  viewId: InspectionListViewId,
): Record<string, InspectionListViewId> {
  return { [INSPECTION_LIST_VIEW_QUERY_PARAM]: viewId };
}
