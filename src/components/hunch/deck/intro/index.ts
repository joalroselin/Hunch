import type { Slide } from "../types"
import { Film, HOLD } from "./film"

// The opening film. It plays by itself once started, then folds into the landing page.
export const INTRO: Slide[] = [{ id: "intro", title: "Hunch", ground: "cream", steps: HOLD.length, hold: HOLD, then: "/", Component: Film }]
