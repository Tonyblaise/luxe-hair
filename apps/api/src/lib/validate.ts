import { zValidator } from "@hono/zod-validator";
import type { ValidationTargets } from "hono";
import { HTTPException } from "hono/http-exception";
import type { ZodType } from "zod";

// Throwing keeps validation errors out of each route's typed response union.
export const validate = <Target extends keyof ValidationTargets, Schema extends ZodType>(
  target: Target,
  schema: Schema,
) =>
  zValidator(target, schema, (result) => {
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = issue ? `${issue.path.join(".") || target}: ${issue.message}` : "Invalid request";
      throw new HTTPException(400, { message });
    }
  });
