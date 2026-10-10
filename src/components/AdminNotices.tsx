import { ErrorNotice, OkNotice } from "./Notice";

export async function AdminNotices({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { ok, error } = await searchParams;
  return (
    <>
      <OkNotice message={typeof ok === "string" ? ok : null} />
      <ErrorNotice message={typeof error === "string" ? error : null} />
    </>
  );
}
