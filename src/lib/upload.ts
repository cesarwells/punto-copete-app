import "server-only";
import { randomUUID } from "node:crypto";
import { adminClient } from "./supabase/admin";

const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

// Sube una foto al bucket público "imagenes" y devuelve su URL, o null si no se eligió archivo.
export async function uploadImage(file: FormDataEntryValue | null, folder: string): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;
  const ext = TYPES[file.type];
  if (!ext) throw new Error("La foto debe ser JPG, PNG o WEBP.");
  if (file.size > 5 * 1024 * 1024) throw new Error("La foto pesa más de 5 MB.");
  const path = `${folder}/${randomUUID()}.${ext}`;
  const db = adminClient();
  const { error } = await db.storage.from("imagenes").upload(path, file, { contentType: file.type });
  if (error) throw error;
  return db.storage.from("imagenes").getPublicUrl(path).data.publicUrl;
}
