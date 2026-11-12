import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"
import { Toaster } from "@/components/ui/sonner"
import { homeFonts } from "@/components/hunch/home/fonts"
import { TabVisibility } from "@/components/hunch/shell/tab-visibility"
import "./globals.css"
import "./app-look.css"
// The hh- classes (type, grain, drop, fields, pills) are shared with the landing page.
import "@/components/hunch/home/look.css"

// Bundled locally so builds and demos never depend on the network.
// Post images render the peso sign in Geist.
const geist = localFont({
  src: "./fonts/Geist-VF.ttf",
  variable: "--font-geist",
  weight: "100 900",
  display: "swap",
  preload: false,
})

// Result numbers only.
const doto = localFont({
  src: "./fonts/Doto-VF.ttf",
  variable: "--font-doto",
  weight: "100 900",
  display: "swap",
  preload: false,
})

// Post images still render in Schibsted, so it stays.
const schibsted = localFont({
  src: "./fonts/SchibstedGrotesk-VF.ttf",
  variable: "--font-schibsted",
  weight: "400 900",
  display: "swap",
  preload: false,
})

export const metadata: Metadata = {
  title: "Hunch",
  description: "Meet your suki. Tell Hunch what you sell. You get 8 posts, each for a potential buyer.",
}

export const viewport: Viewport = {
  themeColor: "#f4ecdd",
  colorScheme: "light",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${homeFonts} ${geist.variable} ${doto.variable} ${schibsted.variable}`}>
      <body className="antialiased">
        <TabVisibility />
        {children}
        <Toaster />
      </body>
    </html>
  )
}
