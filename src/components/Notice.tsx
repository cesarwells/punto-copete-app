export function ErrorNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-red-800">
      {message}
    </div>
  );
}

export function OkNotice({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-green-800">
      {message}
    </div>
  );
}
