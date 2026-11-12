import type { Metadata } from "next"

import { AppShell } from "@/components/hunch/shell"
import { PostsScreen } from "@/components/hunch/flow/posts"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"
export const metadata: Metadata = { title: "Your 8 posts · Hunch" }

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

export default async function PostsPage({ searchParams }: Props) {
  const { demo } = await searchParams
  return (
    <AppShell step="posts" serverMode={getMode()}>
      <PostsScreen demo={demo === "1"} />
    </AppShell>
  )
}
