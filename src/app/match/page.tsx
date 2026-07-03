"use client";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  return (
    <div className="flex flex-col h-30 xl:h-50">
      <div onClick={() => router.back()}>Back</div>
      <div>Vendors, matched with your needs!</div>
    </div>
  );
}
