import Link from "next/link";
import Image from "next/image";
import type { Settings } from "@/lib/data";

export function BrandHeader({ settings }: { settings: Settings }) {
  return (
    <header className="bg-brand text-white">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          {settings.logo_url ? (
            <Image src={settings.logo_url} alt="" width={40} height={40} className="rounded-lg bg-white object-contain" />
          ) : (
            <span className="grid size-10 place-items-center rounded-lg bg-accent font-black text-stone-900">PC</span>
          )}
          <span className="text-lg font-bold">{settings.business_name}</span>
        </Link>
      </div>
    </header>
  );
}

// Aplica los colores de marca configurados en el panel.
export function brandStyle(settings: Settings): React.CSSProperties {
  return { ["--brand" as string]: settings.brand_primary, ["--accent" as string]: settings.brand_secondary };
}
