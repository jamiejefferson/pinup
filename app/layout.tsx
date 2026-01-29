import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PinUp - Prototype Review",
  description: "Pin contextual feedback on design prototypes",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
