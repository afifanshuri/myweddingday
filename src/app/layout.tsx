import "@/css/globals.css";

import { DM_Sans, Libre_Baskerville } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-libre",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${dmSans.variable} ${libre.variable}`}>
        {children}
      </body>
    </html>
  );
}
