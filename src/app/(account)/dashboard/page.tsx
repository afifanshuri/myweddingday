import { Suspense } from "react";
import { requireRouteAccess } from "@/services/others/pageAccessService";
import { ROUTES } from "@/config/routes";
import MainButton from "@/components/commonComponents/MainButton";
import AccountStatus from "@/components/commonComponents/AccountStatus";
import { FiCalendar, FiHeart, FiPieChart } from "react-icons/fi";

async function DashboardContent() {
  await requireRouteAccess(ROUTES.dashboard);

  return <main className="mx-auto min-h-screen max-w-6xl px-5 py-10 sm:px-8 sm:py-16">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-(--tertiary) pb-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-(--positive-tertiary)">myweddingday</p>
        <h1 className="libre-font mt-3 text-3xl text-(--positive-tertiary) sm:text-4xl">Your dashboard</h1>
      </div>
      <AccountStatus />
    </header>
    <section className="py-10" aria-labelledby="dashboard-welcome">
      <h2 id="dashboard-welcome" className="libre-font text-2xl">Welcome back.</h2>
      <p className="mt-3 max-w-xl text-sm leading-6 text-foreground/65">Your wedding planning space is coming soon. For now, you can continue exploring vendors for your day.</p>
      <MainButton href={ROUTES.weddingPlan} className="mt-6">Plan your wedding</MainButton>
    </section>
    <div className="grid gap-4 sm:grid-cols-3">
      {[{ title: "Wedding plan", icon: FiCalendar }, { title: "Saved vendors", icon: FiHeart }, { title: "Budget overview", icon: FiPieChart }].map(({ title, icon: Icon }) =>
        <section key={title} className="rounded-xl border border-(--tertiary) bg-white p-6">
          <Icon aria-hidden="true" className="size-6 text-(--positive-tertiary)" />
          <h2 className="mt-5 text-base font-semibold">{title}</h2>
          <p className="mt-2 text-sm text-foreground/50">Coming soon</p>
        </section>)}
    </div>
  </main>;
}

export default function DashboardPage() {
  return <Suspense fallback={<p role="status" className="flex min-h-screen items-center justify-center">Loading your dashboard…</p>}>
    <DashboardContent />
  </Suspense>;
}
