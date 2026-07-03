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
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {children}
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          height: "100%",
        }}
      >
        <div style={{ display: "flex", flex: 4, border: "1px solid" }}>
          {vendors}
        </div>
        <div style={{ display: "flex", flex: 1, border: "1px solid" }}>
          {budget}
        </div>
      </div>
    </div>
  );
}
