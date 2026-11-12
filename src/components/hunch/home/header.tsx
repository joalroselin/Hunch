"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"

import { useReduced } from "@/components/ds/instruments"
import { LetterRoll } from "./letter-roll"
import { HunchMark } from "./mark"

// Focuses the hero box while the hero is on screen, otherwise the box in the closing scene.
function tryYourProduct(reduced: boolean) {
  const behavior: ScrollBehavior = reduced ? "auto" : "smooth"
  const hero = document.getElementById("hero")
  const heroBox = hero?.getBoundingClientRect()
  if (hero && heroBox && heroBox.bottom > window.innerHeight * 0.45) {
    if (window.scrollY > 0) window.scrollTo({ top: 0, behavior })
    document.getElementById("hero-prompt")?.focus({ preventScroll: true })
    return
  }
  const band = document.getElementById("try")
  if (!band) return
  band.scrollIntoView({ behavior, block: "start" })
  document.getElementById("try-box")?.focus({ preventScroll: true })
}

// The wordmark, in ink.
function Wordmark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 2259.2 700.5" role="img" aria-label="Hunch" className={className}>
      <path
        fill="currentColor"
        d="M11 687.5H140Q151 687.5 151 676.5V473.5Q151 411.5 159.5 369.5Q168 327.5 184 306.5Q200 285.5 224 285.5Q250 285.5 261.5 311.5Q273 337.5 273 395.5V676.5Q273 687.5 284 687.5H413Q424 687.5 424 676.5V379.5Q424 260.5 390.5 204Q357 147.5 286 147.5Q243 147.5 212 169Q181 190.5 162.5 239.5Q144 288.5 131.5 376.5Q130 346.5 134 311Q138 275.5 142 237.5Q146 199.5 148.5 165.5Q151 131.5 151 109.5V3.5Q151 1.2 150 0L0 29.6V676.5Q0 687.5 11 687.5ZM1846.2 687.5H1975.2Q1986.2 687.5 1986.2 676.5V473.5Q1986.2 411.5 1994.7 369.5Q2003.2 327.5 2019.2 306.5Q2035.2 285.5 2059.2 285.5Q2085.2 285.5 2096.7 311.5Q2108.2 337.5 2108.2 395.5V676.5Q2108.2 687.5 2119.2 687.5H2248.2Q2259.2 687.5 2259.2 676.5V379.5Q2259.2 260.5 2225.7 204Q2192.2 147.5 2121.2 147.5Q2078.2 147.5 2047.2 169Q2016.2 190.5 1997.7 239.5Q1979.2 288.5 1966.7 376.5Q1965.2 346.5 1969.2 311Q1973.2 275.5 1977.2 237.5Q1981.2 199.5 1983.7 165.5Q1986.2 131.5 1986.2 109.5V3.5Q1986.2 1.2 1985.2 0L1835.2 29.6V676.5Q1835.2 687.5 1846.2 687.5ZM934 687.5H1063Q1074 687.5 1074 676.5V474.5Q1074 413.5 1081.5 371Q1089 328.5 1105 306.5Q1121 284.5 1146 284.5Q1174 284.5 1185 311.5Q1196 338.5 1196 395.5V676.5Q1196 687.5 1207 687.5H1337Q1348 687.5 1348 676.5V366.5Q1348 254.5 1313 201Q1278 147.5 1205 147.5Q1159 147.5 1127.5 169.5Q1096 191.5 1079 238.5Q1062 285.5 1055 367.5L1052 165.5Q1052 160.5 1047 160.5H928Q923 160.5 923 165.5V676.5Q923 687.5 934 687.5ZM602 700.5Q645 700.5 676.5 680Q708 659.5 726 612.5Q744 565.5 751.5 493.5L753.9 676.5Q754 687.5 765 687.5H873Q878.5 687.5 881.2 684.8Q884 682 884 676.5L883 448.5Q883 443.5 883 438.5V165.5Q883 160.5 878 160.5H737Q732 160.5 732 165.5V384.5Q732 428.5 728 462Q724 495.5 715 517.5Q706 539.5 693 551Q680 562.5 663 562.5Q637 562.5 625.5 537.5Q614 512.5 614 453.5V165.5Q614 160.5 609 160.5H467Q462 160.5 462 165.5V471.5Q462 588.5 496 644.5Q530 700.5 602 700.5ZM1605 700.5Q1667 700.5 1708 681Q1749 661.5 1771.5 627.5Q1794 593.5 1801 552Q1808 510.5 1800 467.5L1663 440.9Q1667 485.5 1664 515.5Q1661 545.5 1647.5 566Q1634 586.5 1606 586.5Q1581 586.5 1564 568Q1547 549.5 1538.5 511.5Q1530 473.5 1530 416.5Q1530 380.5 1534.5 352Q1539 323.5 1547.5 304Q1556 284.5 1569 275Q1582 265.5 1600 265.5Q1621 265.5 1634.5 279.5Q1648 293.5 1653.5 319.5Q1659 345.5 1655 394.8L1790 368.5Q1800 309.5 1783 259.5Q1766 209.5 1721 178.5Q1676 147.5 1603 147.5Q1541 147.5 1498 170Q1455 192.5 1428.5 232Q1402 271.5 1390 322Q1378 372.5 1378 429.5Q1378 485.5 1390 535Q1402 584.5 1429 621.5Q1456 658.5 1499.5 679.5Q1543 700.5 1605 700.5Z"
      />
    </svg>
  )
}

export function HomeHeader() {
  const ref = useRef<HTMLElement>(null)
  const [solid, setSolid] = useState(false)
  const reduced = useReduced()

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Over a color field the strip goes clear, in the field's own text color, so the poster runs to the top.
  useEffect(() => {
    const header = ref.current
    if (!header) return
    let raf = 0
    const look = () => {
      raf = 0
      const y = Math.round(header.getBoundingClientRect().height / 2)
      let field = ""
      for (const el of document.elementsFromPoint(Math.round(window.innerWidth / 2), y)) {
        if (header.contains(el)) continue
        const f = el.closest(".hh-field")
        // A field still fading in does not count yet.
        if (f && parseFloat(getComputedStyle(f).opacity) > 0.6) field = f.classList.contains("hh-field-mangga") ? "light" : "dark"
        break
      }
      if (field) header.dataset.field = field
      else delete header.dataset.field
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(look)
    }
    kick()
    window.addEventListener("scroll", kick, { passive: true })
    window.addEventListener("resize", kick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener("scroll", kick)
      window.removeEventListener("resize", kick)
    }
  }, [])

  return (
    <header ref={ref} data-hx-el="header" data-solid={solid} className="hh-header hx-hide">
      <div className="hh-header-row">
        <Link href="/" className="hh-logo shrink-0" aria-label="Hunch, home">
          <HunchMark />
          <Wordmark className="hh-wordmark" />
        </Link>
        <nav aria-label="Main" className="hh-nav">
          <a href="#how-it-works" className="hh-link hh-nav-wide group">
            <LetterRoll text="How it works" />
          </a>
          <Link href="/start?demo=1" className="hh-link hh-nav-mid group">
            <LetterRoll text="Elle's Candles case study" />
          </Link>
          <button type="button" className="hh-pill group" onClick={() => tryYourProduct(reduced)}>
            <LetterRoll text="Try it free" />
          </button>
        </nav>
      </div>
    </header>
  )
}
