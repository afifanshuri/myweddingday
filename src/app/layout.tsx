import "@/css/globals.css";
import AccountAccessProvider from "@/components/commonComponents/AccountAccessProvider";

import { DM_Sans, Libre_Baskerville } from "next/font/google";

const bodyFont = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const headingFont = Libre_Baskerville({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>
        <AccountAccessProvider>{children}</AccountAccessProvider>
      </body>
    </html>
  );
}
