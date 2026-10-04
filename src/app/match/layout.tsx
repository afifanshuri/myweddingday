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
    <div className="flex flex-col h-screen">
      {children}
      <div className="flex flex-col xl:flex-row h-full">
        <div className="min-w-0 flex-4 justify-center items-center">{vendors}</div>
        <div className="min-w-0 flex-1 justify-center items-center">{budget}</div>
      </div>
    </div>
  );
}
