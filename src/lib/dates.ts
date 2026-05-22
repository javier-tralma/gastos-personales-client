export function todayInputValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function dateInputValue(value: string) {
  return value.slice(0, 10);
}

export function formatCalendarDate(value: string) {
  const [year, month, day] = dateInputValue(value).split('-');
  return `${day}-${month}-${year}`;
}

export function formatPeriodMonth(value?: number | null) {
  if (!value) return 'Sin periodo';
  const year = Math.floor(value / 100);
  const month = String(value % 100).padStart(2, '0');
  return `${month}/${year}`;
}

export function monthValueToInput(value?: number | null) {
  if (!value) return '';
  const year = Math.floor(value / 100);
  const month = String(value % 100).padStart(2, '0');
  return `${year}-${month}`;
}

export function monthInputToValue(value: string) {
  const [year, month] = value.split('-');
  return Number(`${year}${month}`);
}
