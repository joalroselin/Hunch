import type { Metadata } from "next"

import { AppShell } from "@/components/hunch/shell"
import { StudioScreen } from "@/components/hunch/flow/studio/studio-screen"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Studio · Hunch" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function StudioPage({ searchParams }: Props) {
  const { demo } = await searchParams
  const mode = getMode()
  return (
    <AppShell step="studio" serverMode={mode}>
      <StudioScreen demo={demo === "1"} serverMode={mode} />
    </AppShell>
  )
}
