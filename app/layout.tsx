import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./workspace.css";

// Brand face from fish-and-bear/hunch, bundled so builds never need the network.
const bricolage = localFont({
  src: "./fonts/BricolageGrotesque-VF.ttf",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Hunch — Creator Workspace",
  description: "Plan social posts, record performance, and learn what works in one creator workspace.",
};

export const viewport: Viewport = { themeColor: "#f4ecdd", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={bricolage.variable}><body>{children}</body></html>;
}
