import { HTTPException } from "hono/http-exception";

const MAX_BYTES = 10 * 1024 * 1024;
const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

/** Saves a receipt image to R2 under <companyId>/ and returns its object key. */
export async function saveReceipt(bucket: R2Bucket, companyId: string, file: File): Promise<string> {
  const ext = EXTENSIONS[file.type];
  if (!ext) throw new HTTPException(400, { message: "Receipts must be a JPEG, PNG, WebP or HEIC image." });
  if (file.size > MAX_BYTES) throw new HTTPException(400, { message: "Receipts must be 10 MB or smaller." });

  const key = `${companyId}/${crypto.randomUUID()}.${ext}`;
  await bucket.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  return key;
}

/** Removes every receipt stored for a company (used when the company is deleted). */
export async function removeCompanyUploads(bucket: R2Bucket, companyId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(companyId)) return;
  let cursor: string | undefined;
  do {
    const page = await bucket.list({ prefix: `${companyId}/`, cursor });
    if (page.objects.length) await bucket.delete(page.objects.map((o) => o.key));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

export async function readReceipt(bucket: R2Bucket, key: string) {
  const object = await bucket.get(key);
  if (!object) throw new HTTPException(404, { message: "Receipt not found" });
  return { body: object.body, type: object.httpMetadata?.contentType ?? "application/octet-stream" };
}
