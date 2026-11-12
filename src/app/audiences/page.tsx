import type { Metadata } from "next"

import { AppShell } from "@/components/hunch/shell"
import { AudiencesScreen } from "@/components/hunch/flow/audiences/audiences-screen"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Your 8 hunches · Hunch" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function AudiencesPage({ searchParams }: Props) {
  const { demo } = await searchParams
  return (
    <AppShell step="audiences" serverMode={getMode()}>
      <AudiencesScreen demo={demo === "1"} />
    </AppShell>
  )
}
