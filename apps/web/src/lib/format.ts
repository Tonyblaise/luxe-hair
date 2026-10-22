export { formatKES, formatKESShort } from "@luxe-hair/shared";

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "Cut & Style, Blowout +2" — how an employee is described now that services replace job roles. */
export function servicesSummary(names: string[], max = 2) {
  if (names.length === 0) return "No services yet";
  const shown = names.slice(0, max).join(", ");
  return names.length > max ? `${shown} +${names.length - max}` : shown;
}
