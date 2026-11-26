import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { getVerifiedAccountUser } from "@/services/others/accountAccessService";
import { ROUTES } from "@/config/routes";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";
import { SettingsTitle } from "@/components/commonComponents/SettingsSections";
import SettingsPanel from "@/components/commonComponents/SettingsPanel";

// Signed-in only, so there is no signed-out shell to validate as an instant navigation (see the account layout).
export const instant = false;

async function SettingsContent() {
  await requireRouteAccess(ROUTES.settings);
  const user = await getVerifiedAccountUser();

  return <main className="mx-auto min-h-screen max-w-5xl space-y-5 px-4 py-6 sm:px-8 sm:py-10">
    <SettingsTitle />
    <SettingsPanel email={user?.email ?? null} createdAt={user?.created_at ?? null} />
  </main>;
}

export default function SettingsPage() {
  return <Suspense fallback={<LoadingScreen label="Loading your settings…" />}><SettingsContent /></Suspense>;
}
