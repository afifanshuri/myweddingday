import "@/css/globals.css";

export default function VendorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-col px-6 pb-10 pt-10 sm:px-10">
      {children}
    </div>
  );
}
