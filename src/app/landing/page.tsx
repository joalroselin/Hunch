import { HomeScreen } from "@/components/hunch/home/home-screen"
import { getMode } from "@/lib/hunch/engine/mode"

export const dynamic = "force-dynamic"

export default function Home() {
  return <HomeScreen serverMode={getMode()} />
}
