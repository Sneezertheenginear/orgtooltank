"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="rounded-xl border border-black/15 bg-white px-7 py-4 font-bold text-black transition hover:bg-neutral-100"
    >
      Back
    </button>
  );
}
