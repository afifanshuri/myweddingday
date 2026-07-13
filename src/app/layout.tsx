import "./globals.css";
import { Libre_Baskerville, Poppins, Josefin_Sans } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

const libre = Libre_Baskerville({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-libre",
});

const josefin = Josefin_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-josefin",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body
        className={`${poppins.variable} ${libre.variable} ${josefin.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
