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
  labelKey: string;
  descriptionKey: string;
  statuses: readonly InspectionStatus[];
  includesOrphanDevices?: boolean;
}

export const DEFAULT_INSPECTION_LIST_VIEW_ID: InspectionListViewId = 'contact';

export const INSPECTION_LIST_VIEWS: readonly InspectionListViewDefinition[] = [
  {
    id: 'planned',
    labelKey: 'inspections.views.planned.label',
    descriptionKey: 'inspections.views.planned.description',
    statuses: ['new', 'reminder_sent'],
  },
  {
    id: 'contact',
    labelKey: 'inspections.views.contact.label',
    descriptionKey: 'inspections.views.contact.description',
    statuses: ['customer_confirmed', 'customer_not_confirmed'],
  },
  {
    id: 'scheduled',
    labelKey: 'inspections.views.scheduled.label',
    descriptionKey: 'inspections.views.scheduled.description',
    statuses: ['scheduled'],
  },
  {
    id: 'closed',
    labelKey: 'inspections.views.closed.label',
    descriptionKey: 'inspections.views.closed.description',
    statuses: ['completed', 'cancelled'],
  },
  {
    id: 'orphan-devices',
    labelKey: 'inspections.views.orphanDevices.label',
    descriptionKey: 'inspections.views.orphanDevices.description',
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
