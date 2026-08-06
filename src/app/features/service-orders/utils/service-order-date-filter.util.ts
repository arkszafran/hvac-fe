import { ServiceOrder } from '../models/service-order.model';

export type ServiceOrderDateFilter = 'today' | 'tomorrow' | 'this_week' | 'all';

export function matchesServiceOrderDateFilter(
  order: ServiceOrder,
  filter: ServiceOrderDateFilter,
  currentDate = new Date(),
): boolean {
  if (filter === 'all' || order.status === 'contact_required' || !order.scheduledAt.trim()) {
    return true;
  }

  const scheduledDate = parseLocalDate(order.scheduledAt);

  if (!scheduledDate) {
    return true;
  }

  const today = startOfDay(currentDate);

  switch (filter) {
    case 'today':
      return scheduledDate <= today;
    case 'tomorrow':
      return isSameDay(scheduledDate, addDays(today, 1));
    case 'this_week':
      return (
        isWithinCurrentWeek(scheduledDate, today) || (scheduledDate < today && isUnfinished(order))
      );
  }
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }

  return date;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function addDays(value: Date, days: number): Date {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

function isSameDay(left: Date, right: Date): boolean {
  return left.getTime() === right.getTime();
}

function isWithinCurrentWeek(scheduledDate: Date, today: Date): boolean {
  const mondayOffset = (today.getDay() + 6) % 7;
  const weekStart = addDays(today, -mondayOffset);
  const weekEnd = addDays(weekStart, 6);

  return scheduledDate >= weekStart && scheduledDate <= weekEnd;
}

function isUnfinished(order: ServiceOrder): boolean {
  return order.status !== 'completed' && order.status !== 'cancelled';
}
