"use client"

import { createContext, useContext } from "react"

import { STAGE_H, STAGE_W } from "./types"

// Where the stage sits on screen, in screen px: scale, offset, screen size.
export type StageBox = { s: number; x: number; y: number; w: number; h: number }

export const StageContext = createContext<StageBox>({ s: 1, x: 0, y: 0, w: STAGE_W, h: STAGE_H })

export const useStageBox = () => useContext(StageContext)

export function fitStage(w: number, h: number): StageBox {
  const s = Math.min(w / STAGE_W, h / STAGE_H)
  return { s, x: (w - STAGE_W * s) / 2, y: (h - STAGE_H * s) / 2, w, h }
}
