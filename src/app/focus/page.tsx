import { redirect } from "next/navigation"

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> }

// Old name of Next week. Keeps the query, so /focus?demo=1 still opens the sample.
export default async function FocusPage({ searchParams }: Props) {
  const params = await searchParams
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x))
    else if (v != null) q.set(k, v)
  }
  const qs = q.toString()
  redirect(`/next-week${qs ? `?${qs}` : ""}`)
}
