import { toInspectionDateTimeLocalValue } from './device-inspection.model';

describe('toInspectionDateTimeLocalValue', () => {
  it('adds the default inspection time to a date-only value', () => {
    expect(toInspectionDateTimeLocalValue('2026-05-19')).toBe('2026-05-19T09:00');
  });

  it('keeps the date and time from a local scheduled value', () => {
    expect(toInspectionDateTimeLocalValue('2026-05-19T16:30:00')).toBe('2026-05-19T16:30');
  });

  it('returns an empty value for an unsupported format', () => {
    expect(toInspectionDateTimeLocalValue('19.05.2026, 16:30')).toBe('');
  });
});
