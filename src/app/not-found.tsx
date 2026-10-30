import MainButton from "@/components/commonComponents/MainButton";
import { ROUTES } from "@/config/routes";

export default function NotFound() {
  return <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
    <h1 className="libre-font text-3xl">Page not found</h1>
    <MainButton href={ROUTES.home}>Go home</MainButton>
  </main>;
}
