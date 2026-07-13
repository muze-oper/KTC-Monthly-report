import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muze Ops Portal — KTC Monthly Report",
  description: "KTC Website Jira monthly ops report",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
