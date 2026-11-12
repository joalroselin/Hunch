import localFont from "next/font/local"

// Landing page only. Bundled locally like the app fonts.
export const bricolage = localFont({
  src: "../../../app/fonts/BricolageGrotesque-VF.ttf",
  variable: "--font-bricolage",
  weight: "200 800",
  display: "swap",
  declarations: [{ prop: "font-stretch", value: "75% 100%" }],
})

// On-video text inside post frames.
export const tiktok = localFont({
  src: "../../../app/fonts/TikTokSans-VF.ttf",
  variable: "--font-tiktok",
  weight: "300 900",
  display: "swap",
  preload: false,
})

export const homeFonts = `${bricolage.variable} ${tiktok.variable}`
