import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VoiceLoan",
  description:
    "Apply for a bike, vehicle, or mobile loan by talking to a voice advisor. Admins review Jev risk scores.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full bg-stone-50 font-sans text-slate-900">
        <Nav />
        <main className="mx-auto w-full max-w-6xl px-4 py-10">{children}</main>
      </body>
    </html>
  );
}
