export { formatKES, formatKESShort } from "@luxe-hair/shared";

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
