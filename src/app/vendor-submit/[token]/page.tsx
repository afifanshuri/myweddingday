import { Suspense } from "react";
import type { Metadata } from "next";
import AdminVendorForm from "@/components/adminComponents/AdminVendorForm";
import LoadingScreen from "@/components/commonComponents/LoadingScreen";

// Public: the token in the URL is the vendor's only credential, so keep it out of Referer headers and search engines.
export const metadata: Metadata = {
  title: "Add your listing · myweddingday",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

type Props = { params: Promise<{ token: string }> };

async function SubmitForm({ params }: Props) {
  const { token } = await params;
  return <AdminVendorForm submitToken={token} />;
}

export default function VendorSubmitPage(props: Props) {
  return <Suspense fallback={<LoadingScreen label="Opening your form…" />}><SubmitForm {...props} /></Suspense>;
}
