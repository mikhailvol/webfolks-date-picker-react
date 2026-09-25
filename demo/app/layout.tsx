import type { Metadata } from "next";
import type { ReactNode } from "react";
import "webfolks-date-picker-react/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "WebFolks Date Picker — React demo",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
