export function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function getMonthDays(activeDate: Date) {
  const year = activeDate.getFullYear();
  const month = activeDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const mondayOffset = (firstDay.getDay() + 6) % 7;
  const days: Date[] = [];

  for (let index = -mondayOffset; days.length < 42; index += 1) {
    days.push(new Date(year, month, 1 + index));
  }

  return { days, firstDay, lastDay };
}

export function formatSpanishDate(dateKey: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date(`${dateKey}T00:00:00`));
}

export function formatSpanishDayMonth(dateKey: string) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long"
  }).format(new Date(`${dateKey}T00:00:00`));
}

export const spanishWeekdays = ["L", "M", "X", "J", "V", "S", "D"];
