"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DuplicateFinderDownloadPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [status, setStatus] = useState<"checking" | "valid" | "invalid">(
    "checking",
  );
  const [message, setMessage] = useState("Checking your payment...");

  useEffect(() => {
    if (!sessionId) {
      setStatus("invalid");
      setMessage("Missing payment session.");
      return;
    }

    async function verifyPayment() {
      try {
        const response = await fetch(
          `/api/verify-download?session_id=${encodeURIComponent(sessionId!)}`,
        );
        const data = await response.json();
        setMessage(data.message);
        setStatus(data.valid ? "valid" : "invalid");
      } catch {
        setStatus("invalid");
        setMessage("Could not verify payment.");
      }
    }

    verifyPayment();
  }, [sessionId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f7f4] px-6">
      <div className="w-full max-w-xl rounded-3xl border border-black/10 bg-white p-10 text-center">
        <h1 className="text-4xl font-black tracking-tight">Duplicate Finder</h1>

        <p className="mt-6 text-lg text-neutral-600">{message}</p>

        {status === "valid" && sessionId && (
          <a
            href={`/api/downloads?session_id=${encodeURIComponent(sessionId)}`}
            className="mt-6 inline-block rounded-full bg-black px-8 py-3 text-white font-semibold"
          >
            Download Now
          </a>
        )}
      </div>
    </main>
  );
}
