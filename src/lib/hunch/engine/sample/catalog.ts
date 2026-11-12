import type { TestRun, Version } from "../../types";

// The two sample sellers, without their data, so screens can name them cheaply. Both are personas.
export type SampleKey = "candles" | "matcha";

export interface SampleInfo {
  key: SampleKey;
  name: string; // product name as saved in the run
  persona: string;
  runId: string;
  price: string; // whole pesos, the one the swapper replaces
  describes: string; // what the saved posts are about
  photoDir: string;
  photos: Partial<Record<string, string>>; // post code -> file in photoDir
}

export const SAMPLES: Record<SampleKey, SampleInfo> = {
  candles: {
    key: "candles",
    name: "Elle's Candles",
    persona: "Elle",
    runId: "run_elle_sample",
    price: "₱350",
    describes: "Elle's soy candles",
    photoDir: "/sample/candles",
    photos: { A1: "A1.jpg", A2: "A2.jpg", A3: "A3.jpg", A4: "A4.jpg", A5: "A5.jpg", A6: "A6.jpg", A7: "A7.jpg", A8: "A8.jpg" },
  },
  matcha: {
    key: "matcha",
    name: "Kaye's Matcha",
    persona: "Kaye",
    runId: "run_matcha_sample",
    price: "₱480",
    describes: "Kaye's matcha tins",
    photoDir: "/sample/matcha",
    photos: { A1: "M1.jpg", A2: "M2.jpg", A3: "M3.jpg", A4: "M4.jpg", A6: "M6.jpg" },
  },
};

// Typed products that mention matcha get Kaye's run; everything else gets Elle's.
export function sampleKeyFor(p: { name?: string | null; description?: string | null } = {}): SampleKey {
  return /matcha/i.test(`${p.name ?? ""} ${p.description ?? ""}`) ? "matcha" : "candles";
}

export function sampleKeyOf(run: Pick<TestRun, "id" | "sample"> | null | undefined): SampleKey | null {
  if (!run) return null;
  for (const s of Object.values(SAMPLES)) if (run.sample?.of === s.name || run.id.startsWith(s.runId)) return s.key;
  return null;
}

export function personaOf(run: Pick<TestRun, "id" | "sample"> | null | undefined) {
  return SAMPLES[sampleKeyOf(run) ?? "candles"].persona;
}

// Photo URL for a sample post by its code; next-week posts use the photo of their audience's test post.
export function samplePhotoFor(run: Pick<TestRun, "id" | "sample" | "versions"> | null | undefined, v: Pick<Version, "code" | "audienceId">) {
  const key = sampleKeyOf(run);
  if (!key || !run) return undefined;
  const info = SAMPLES[key];
  const code = /^A\d$/.test(v.code) ? v.code : run.versions.find((x) => x.audienceId === v.audienceId)?.code;
  const file = code ? info.photos[code] : undefined;
  return file ? `${info.photoDir}/${file}` : undefined;
}
