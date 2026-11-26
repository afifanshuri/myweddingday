"use client";

import { useSearchParams } from "next/navigation";
import { FiAlertTriangle, FiArrowLeft, FiChevronRight, FiDownload, FiKey, FiMonitor, FiStar, FiUser } from "react-icons/fi";
import type { IconType } from "react-icons";
import { useT } from "@/i18n";
import { ROUTES } from "@/config/routes";
import { AccountSettings, DataSettings, DeleteAccountSettings, PasswordSettings, PlanSettings, SessionSettings } from "./SettingsSections";

const SECTIONS = ["account", "plan", "password", "sessions", "data", "delete"] as const;
type Section = (typeof SECTIONS)[number];
const ICONS: Record<Section, IconType> = { account: FiUser, plan: FiStar, password: FiKey, sessions: FiMonitor, data: FiDownload, delete: FiAlertTriangle };

/**
 * Settings as a list of sections beside the open one (like a phone's settings app). The open section is in the address
 * (?section=…), changed with the browser's own history so Back works and nothing reloads. Phones show the list, or
 * one section with a way back to the list.
 */
export default function SettingsPanel({ email, createdAt }: { email: string | null; createdAt: string | null }) {
  const t = useT();
  const s = t.settings;
  const param = useSearchParams().get("section");
  const chosen = SECTIONS.includes(param as Section) ? param as Section : null;
  // Larger screens always show a section: the chosen one, or the first.
  const active: Section = chosen ?? "account";
  const go = (section: Section | null) => window.history.pushState(null, "", section ? `${ROUTES.settings}?section=${section}` : ROUTES.settings);

  const titles: Record<Section, string> = { account: s.account, plan: s.plan, password: s.password, sessions: s.sessions, data: s.data, delete: s.deleteAccount };
  const content: Record<Section, React.ReactNode> = {
    account: <AccountSettings email={email} createdAt={createdAt} />,
    plan: <PlanSettings />,
    password: <PasswordSettings />,
    sessions: <SessionSettings />,
    data: <DataSettings />,
    delete: <DeleteAccountSettings />,
  };

  return <div className="grid overflow-hidden rounded-3xl md:min-h-[32rem] border border-(--tertiary) bg-white md:grid-cols-[18rem_minmax(0,1fr)]">
    {/* The list of sections. On phones it's hidden while a section is open. */}
    <nav aria-label={s.title} className={`border-(--tertiary) p-3 md:border-r ${chosen ? "max-md:hidden" : ""}`}>
      <ul className="flex flex-col gap-1">
        {SECTIONS.map((section) => {
          const Icon = ICONS[section];
          const current = section === active;
          return <li key={section}>
            <a href={`${ROUTES.settings}?section=${section}`} aria-current={current ? "page" : undefined}
              onClick={(event) => { event.preventDefault(); go(section); }}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) ${
                current ? "md:bg-(--secondary)" : ""} hover:bg-(--secondary)/60 ${section === "delete" ? "text-red-700" : "text-(--positive-tertiary)"}`}>
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{titles[section]}</span>
                <span className="block text-xs text-foreground/55">{s.hints[section]}</span>
              </span>
              <FiChevronRight aria-hidden="true" className="size-4 shrink-0 text-foreground/35 md:hidden" />
            </a>
          </li>;
        })}
      </ul>
    </nav>
    {/* The open section. On phones it replaces the list, with a way back. */}
    <div className={`min-w-0 p-5 sm:p-7 ${chosen ? "" : "max-md:hidden"}`}>
      <button type="button" onClick={() => go(null)}
        className="mb-4 inline-flex items-center gap-2 rounded-lg text-sm text-(--positive-tertiary) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--positive-tertiary) md:hidden">
        <FiArrowLeft aria-hidden="true" /> {s.allSettings}
      </button>
      {content[active]}
    </div>
  </div>;
}
