import type { Metadata } from "next"

import { Workspace } from "./workspace"
import "./workspace.css"

export const metadata: Metadata = {
  title: "Hunch workspace",
  description: "Plan, post and track next week's posts.",
}

export default function WorkspacePage() {
  return (
    <div className="jw">
      <Workspace />
    </div>
  )
}
