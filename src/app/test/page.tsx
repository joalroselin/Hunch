import type { Metadata } from "next"

import { AppShell } from "@/components/hunch/shell"
import { RunTestScreen } from "@/components/hunch/flow/test"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Run the test · Hunch" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function TestPage({ searchParams }: Props) {
  const { demo } = await searchParams
  return (
    <AppShell step="test" serverMode={getMode()}>
      <RunTestScreen demo={demo === "1"} />
    </AppShell>
  )
}
