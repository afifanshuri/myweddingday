export default function MatchLayout({
  children,
  budget,
  vendors,
}: Readonly<{
  children: React.ReactNode;
  budget: React.ReactNode;
  vendors: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      {children}
      <div className="flex flex-col xl:flex-row">
        <div className="w-full min-w-0 flex-1">{vendors}</div>
        <div className="w-full min-w-0 xl:sticky xl:top-6 xl:w-80 xl:shrink-0 xl:self-start">{budget}</div>
      </div>
    </div>
  );
}
