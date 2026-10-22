import { revalidatePath } from "next/cache";
import { ApiError } from "./api";

export type ActionState =
  | { ok?: boolean; error?: string; toast?: string; at?: number; data?: Record<string, string> }
  | undefined;

export const fail = (error: string): ActionState => ({ error, at: Date.now() });

/** Runs an API mutation for a server action: ApiError becomes a form error; success revalidates and toasts. */
export async function mutate(
  fn: () => Promise<unknown>,
  opts: {
    toast?: string | ((result: unknown) => string);
    data?: (result: unknown) => Record<string, string>;
    revalidate?: string[];
  } = {},
): Promise<ActionState> {
  let result: unknown;
  try {
    result = await fn();
  } catch (err) {
    if (err instanceof ApiError) return fail(err.message);
    throw err;
  }
  for (const path of opts.revalidate ?? ["/"]) revalidatePath(path, "layout");
  const toast = typeof opts.toast === "function" ? opts.toast(result) : opts.toast;
  return { ok: true, toast, data: opts.data?.(result), at: Date.now() };
}

/** First Zod issue as a readable sentence. */
export function firstIssue(error: { issues: { message: string }[] }, fallback = "Check the details and try again.") {
  return error.issues[0]?.message ?? fallback;
}
