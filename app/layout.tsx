import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "./components/query/QueryProvider";
import { ThemeApplier } from "./components/ThemeApplier";

export const metadata: Metadata = {
  title: "InView",
  description: "InView by MagByte — business analytics for Nigerian SMEs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="apple-icon"
          href="/apple-icon.png"
          type="image/<generated>"
          sizes="<generated>"
        />
        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
          type="image/<generated>"
          sizes="<generated>"
        />
        <link
          rel="icon"
          href="/icon.png"
          type="image/<generated>"
          sizes="<generated>"
        />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body className="font-[DMSans] antialiased bg-white dark:bg-slate-950 text-black dark:text-slate-100">
        <QueryProvider>
          <ThemeApplier />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
