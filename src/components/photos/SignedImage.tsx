"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

// Exibe um arquivo de bucket PRIVADO via URL assinada temporária.
export function SignedImage({
  bucket, path, alt, className,
}: {
  bucket: "exams" | "body-photos" | "avatars"; path: string; alt: string; className?: string;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/storage/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path }),
    })
      .then((r) => r.json())
      .then((j) => active && (j.url ? setUrl(j.url) : setFailed(true)))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [bucket, path]);

  if (failed) {
    return <div className={cn("grid place-items-center bg-slate-100 text-xs text-ink-mute", className)}>indisponível</div>;
  }
  if (!url) {
    return <div className={cn("animate-pulse bg-slate-100", className)} />;
  }
  // eslint-disable-next-line @next/next/no-img-element — URL assinada dinâmica
  return <img src={url} alt={alt} className={className} />;
}
