"use client"

import { MotionConfig } from "framer-motion"

import { useLoadedPhotos } from "@/components/hunch/post/sample-photos"
import type { Mode } from "@/lib/hunch/types"
import { Audiences } from "./audiences"
import { CtaBand } from "./cta-band"
import { photoUrls } from "./data"
import { Faq } from "./faq"
import { HomeFooter } from "./footer"
import { HomeHeader } from "./header"
import { Hero } from "./hero"
import { INTRO_SCRIPT } from "./hero/intro"
import { homeFonts } from "./fonts"
import { HiddenEnding } from "./hidden-ending"
import { HowItWorks } from "./how-it-works"
import { NextWeek } from "./next-week"
import { PostSheetProvider } from "./post-sheet"
import { YourPeople } from "./your-people"
import "./look.css"

export function HomeScreen({ serverMode }: { serverMode: Mode }) {
  useLoadedPhotos(photoUrls)
  return (
    <MotionConfig reducedMotion="user">
      <PostSheetProvider>
        {/* data-hx (entrance mode) is set by the script below before the hero paints. */}
        <div data-hx-root suppressHydrationWarning className={`hunch-home ${homeFonts}`}>
          <script dangerouslySetInnerHTML={{ __html: INTRO_SCRIPT }} />
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <HomeHeader />
          <main id="main">
            <Hero serverMode={serverMode} />
            <Audiences />
            <HowItWorks />
            <YourPeople />
            <NextWeek />
            <Faq />
            <CtaBand serverMode={serverMode} />
          </main>
          <HomeFooter />
          <HiddenEnding />
        </div>
      </PostSheetProvider>
    </MotionConfig>
  )
}
