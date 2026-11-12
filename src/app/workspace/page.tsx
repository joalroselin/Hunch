import type { Metadata } from "next"

import { Workspace } from "./workspace"
import "./workspace.css"

export const metadata: Metadata = {
  title: "Plan and post · Hunch",
  description: "Post one a day and see what works.",
}

export default function WorkspacePage() {
  return (
    <div className="jw">
      <Workspace />
    </div>
  )
}
