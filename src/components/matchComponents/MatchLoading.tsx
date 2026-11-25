"use client";
import { useT } from "@/i18n";

import LoadingScreen from "@/components/commonComponents/LoadingScreen";

export default function MatchLoading() {
  const t = useT();
  return <LoadingScreen label={t.results.loadingMatches} />;
}
