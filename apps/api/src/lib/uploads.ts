import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { HTTPException } from "hono/http-exception";

const UPLOAD_ROOT = path.resolve(process.env.UPLOAD_DIR ?? "uploads");
const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** Saves a receipt image under uploads/<companyId>/ and returns its path relative to the upload root. */
export async function saveReceipt(companyId: string, file: File): Promise<string> {
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new HTTPException(400, { message: "Receipts must be a JPEG, PNG, WebP or HEIC image." });
  if (file.size > MAX_BYTES) throw new HTTPException(400, { message: "Receipts must be 10 MB or smaller." });

  const relative = path.join(companyId, `${randomUUID()}.${ext}`);
  await mkdir(path.join(UPLOAD_ROOT, companyId), { recursive: true });
  await writeFile(path.join(UPLOAD_ROOT, relative), Buffer.from(await file.arrayBuffer()));
  return relative;
}

/** Removes every receipt stored for a company (used when the company is deleted). */
export async function removeCompanyUploads(companyId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(companyId)) return;
  await rm(path.join(UPLOAD_ROOT, companyId), { recursive: true, force: true });
}

export async function readReceipt(relative: string) {
  const full = path.resolve(UPLOAD_ROOT, relative);
  // Stored paths come from saveReceipt, but never read outside the upload root.
  if (!full.startsWith(UPLOAD_ROOT + path.sep)) throw new HTTPException(404, { message: "Receipt not found" });
  const ext = path.extname(full).slice(1);
  const type = Object.entries(EXTENSIONS).find(([, e]) => e === ext)?.[0] ?? "application/octet-stream";
  return { body: await readFile(full), type };
}
