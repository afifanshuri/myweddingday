export default function VendorsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div>
      <div className="flex flex-col mt-20 mb-10">{children}</div>
    </div>
  );
}
