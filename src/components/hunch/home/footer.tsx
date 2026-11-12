"use client"

import { useRef } from "react"
import Link from "next/link"
import { motion, useScroll, useTransform } from "framer-motion"

import { persona } from "./proof/data"
import { useMoving } from "./scroll/film"
import "./proof/base.css"
import "./proof/closing.css"

export function HomeFooter() {
  const ref = useRef<HTMLElement>(null)
  // The field above lifts off the footer, which waits underneath.
  const moving = useMoving()
  const { scrollYProgress: bared } = useScroll({ target: ref, offset: ["start end", "end end"] })
  const under = useTransform(bared, [0, 1], ["-40%", "0%"])
  return (
    <motion.footer ref={ref} id="footer" className="ft" style={moving ? { y: under } : undefined}>
      <div className="ft-small">
        <p>Made in Manila for sellers just starting out.</p>
        <Link href="/start?demo=1" className="ft-up">{`Open ${persona}’s test`}</Link>
        <a
          href="#main"
          className="ft-up"
          onClick={(e) => {
            e.preventDefault()
            // No behavior given, so the page's own scroll-behavior decides: smooth, or instant with reduced motion.
            window.scrollTo({ top: 0 })
            document.querySelector<HTMLElement>(".hh-logo")?.focus({ preventScroll: true })
          }}
        >
          Back to top
        </a>
      </div>
    </motion.footer>
  )
}
