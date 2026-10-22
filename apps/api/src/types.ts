import type { User } from "@luxe-hair/db";

export type AppEnv = {
  Variables: {
    user: User;
    companyId: string;
  };
};
