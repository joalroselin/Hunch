import type { CheckResult } from "../../types";

// Traits Meta treats as personal attributes: age, orientation, gender identity, religion, race, health, money, records.
const TRAITS_EN = [
  "gay", "lesbian", "lesbians", "bisexual", "bi", "trans", "transgender", "queer",
  "christian", "muslim", "catholic", "jewish", "hindu", "buddhist", "atheist", "religious",
  "black", "asian", "latino", "latina", "hispanic", "filipino", "pinoy", "pinay", "chinese",
  "disabled", "pregnant", "depressed", "anxious", "diabetic", "overweight", "fat", "obese", "sick", "ill",
  "single", "divorced", "widowed", "broke", "poor", "in debt", "unemployed", "old", "elderly", "a senior",
  "a teen", "a teenager", "a minor", "bald", "infertile", "an addict", "a criminal", "an ex-convict",
  "\\d{1,3} years old", "over \\d{2}", "under \\d{2}", "in your \\d0s",
].join("|");

const GROUPS_EN = [
  "gays?", "lesbians?", "bisexuals?", "trans (?:people|women|men)", "queers?", "christians?", "muslims?",
  "catholics?", "jews", "hindus", "buddhists?", "atheists?", "seniors?", "singles", "diabetics?",
  "divorcees?", "widows?", "pinoys?", "pinays?", "filipinos?", "latinos?", "asians?",
].join("|");

const TRAITS_TL = [
  "bakla", "bading", "beki", "tomboy", "tibo", "lesbyana", "bisexual", "trans",
  "kristiyano", "katoliko", "muslim", "born again", "iglesia", "inc", "ateista",
  "buntis", "diabetic", "may diabetes", "mataba", "kalbo", "baog", "baliw", "depressed", "may sakit", "maysakit",
  "walang pera", "baon sa utang", "mahirap", "matanda", "senior", "single", "hiwalay", "biyuda", "biyudo",
  "bisaya", "ilokano", "tsinoy", "intsik", "menor de edad", "\\d{1,3} taong gulang",
].join("|");

const PERSONAL: { re: RegExp; label: string }[] = [
  { re: new RegExp(`\\b(?:are|r)\\s+(?:you|u)\\s+(?:${TRAITS_EN}|\\d{1,3}\\+?)(?![\\w-])`, "i"), label: "asks if the viewer has a personal trait" },
  { re: new RegExp(`\\b(?:you(?:'re| are)|ur)\\s+(?:${TRAITS_EN})\\b`, "i"), label: "says the viewer has a personal trait" },
  { re: new RegExp(`\\b(?:meet|date|find|chat with)\\s+(?:other|fellow|local)\\s+(?:${GROUPS_EN})\\b`, "i"), label: "implies the viewer belongs to a group" },
  { re: new RegExp(`\\b(?:other|fellow)\\s+(?:${GROUPS_EN})\\s+like\\s+you\\b`, "i"), label: "implies the viewer belongs to a group" },
  { re: new RegExp(`\\b(?:${GROUPS_EN})\\s+like\\s+you\\b`, "i"), label: "implies the viewer belongs to a group" },
  { re: /\b(?:your|ur)\s+(?:diabetes|depression|anxiety|acne|weight|debt|debts|credit score|religion|faith|disability|illness|condition|sexuality|sexual orientation|race|age|bills you can't pay)\b/i, label: "points at the viewer's health, money or identity" },
  { re: /\bstruggling with\s+(?:your\s+)?(?:weight|debt|depression|anxiety|diabetes|infertility|acne)\b/i, label: "points at the viewer's health or money" },
  { re: new RegExp(`\\b(?:${TRAITS_TL})\\s+ka\\s+(?:ba|na|pa|din|rin)\\b`, "i"), label: "asks if the viewer has a personal trait" },
  { re: new RegExp(`\\b(?:${TRAITS_TL})\\s+ka\\s*\\?`, "i"), label: "asks if the viewer has a personal trait" },
  { re: new RegExp(`\\bikaw\\s+ba\\s+(?:ay\\s+)?(?:${TRAITS_TL})\\b`, "i"), label: "asks if the viewer has a personal trait" },
  { re: new RegExp(`\\b(?:ka\\s+bang|kayo\\s+bang?)\\s+(?:${TRAITS_TL})\\b`, "i"), label: "asks if the viewer has a personal trait" },
  { re: /\bgusto\s+mo(?:ng)?\s+(?:pumayat|magpapayat|mabuntis|gumaling)\b/i, label: "points at the viewer's body or health" },
];

const HEALTH =
  /\b(?:pampapayat|pampayat|pumayat|magpapayat|pampaputi|pampakinis|pampabata|pampalakas ng resistensya|pampagana|gamot|panggamot|nakakagaling|nagpapagaling|makakagaling|lunas|panlunas|detox|cures?|cured|curing|heals?|healing|weight loss|lose weight|losing weight|slimming|burns? fat|fat[- ]?burn(?:ing|er)?|boosts? (?:your )?(?:immunity|immune system|metabolism)|metabolism|anti[- ]?cancer|prevents? (?:cancer|diabetes|disease|illness|sakit)|lowers? (?:blood pressure|cholesterol|blood sugar)|superfood|medicinal)\b/i;

const GAMBLING =
  /\b(?:sugal|magsugal|sabong|e-?sabong|casino|jueteng|lotto|swertres|pustahan|pumusta|tayaan|tumaya|betting|place (?:a|your) bets?|color game|online games? with cash prizes)\b/i;

export function lintText(text: string): CheckResult[] {
  const out: CheckResult[] = [];
  const personal = PERSONAL.find((p) => p.re.test(text));
  if (personal) {
    const hit = text.match(personal.re)?.[0] ?? "";
    out.push({
      kind: "policy",
      passed: false,
      rule: "Meta personal attributes",
      type: "ad_policy",
      quote: hit.trim(),
      note: `The copy ${personal.label} ("${hit.trim()}"). Meta rejects ads that say or hint at who the viewer is. Talk about the moment or the product instead.`,
    });
  }
  const health = text.match(HEALTH);
  if (health) {
    out.push({
      kind: "policy",
      passed: false,
      rule: "PH FDA food health claims",
      type: "claim",
      quote: health[0],
      note: `Says the food has a health effect ("${health[0]}"). In the Philippines, food ads can't claim to cure, treat or slim. Describe the taste and the moment instead.`,
    });
  }
  const gambling = text.match(GAMBLING);
  if (gambling) {
    out.push({
      kind: "policy",
      passed: false,
      rule: "Meta gambling ads",
      type: "ad_policy",
      quote: gambling[0],
      note: `Mentions gambling ("${gambling[0]}"). Meta needs written approval for gambling ads, so this would be rejected.`,
    });
  }
  return out;
}

export function policyCheck(draft: { hook: string; slides: string[]; caption: string; hashtags?: string[]; cta?: string }): CheckResult {
  const text = [draft.hook, ...draft.slides, draft.caption, draft.cta ?? "", ...(draft.hashtags ?? [])].join("\n");
  const fails = lintText(text);
  if (fails.length) return { ...fails[0], note: fails.map((f) => f.note).join(" "), rule: fails.map((f) => f.rule).join(", ") };
  return { kind: "policy", passed: true, rule: "Meta ad rules, PH FDA", note: "No personal traits, health claims or gambling words." };
}
