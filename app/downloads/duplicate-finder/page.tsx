import DuplicateFinderDownloadClient from "./DuplicateFinderDownloadClient";

export default async function DuplicateFinderDownloadPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const params = await searchParams;
  const sessionId = params.session_id ?? "";

  return <DuplicateFinderDownloadClient sessionId={sessionId} />;
}
