export function localDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}
export function validPostDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && localDateKey(date) === value;
}
export function monthDays(month: Date) {
  const first = new Date(month.getFullYear(),month.getMonth(),1,12);
  const start = new Date(first); start.setDate(1-first.getDay());
  const last = new Date(month.getFullYear(),month.getMonth()+1,0,12);
  const length = Math.ceil((first.getDay()+last.getDate())/7)*7;
  return Array.from({length},(_,index)=>{const day=new Date(start);day.setDate(start.getDate()+index);return localDateKey(day);});
}
