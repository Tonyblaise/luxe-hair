"use server";

import { redirect } from "next/navigation";
import { clearAdminToken } from "@/lib/admin";

export async function adminSignOut() {
  await clearAdminToken();
  redirect("/admin/login");
}
