import { lintText } from "./policy";
import { similarity } from "./similar";
import { heuristicCritic } from "./stereotype";

const cases: [string, boolean][] = [
  ["Are you 18 years old?", false],
  ["Are you 18?", false],
  ["Meet other lesbians", false],
  ["Gay dating online now", true],
  ["A service for teens", true],
  ["Struggling with your weight?", false],
  ["Christians like you love this", false],
  ["Bakla ka ba?", false],
  ["Buntis ka ba? Try this.", false],
  ["Ikaw ba ay single?", false],
  ["Uhaw ka na?", true],
  ["Gutom ka na ba? Sili Mango na.", true],
  ["Pampapayat na snack!", false],
  ["Gamot sa antok tuwing night shift", false],
  ["Nakakagaling ng ubo", false],
  ["Cures cravings and boosts your metabolism", false],
  ["Snack na hindi chips. May sili para may sipa.", true],
  ["Sweet treat after a long shift", true],
  ["Libreng taya sa e-sabong", false],
  ["Online casino bonus", false],
  ["Bet ko 'to, sobrang sarap", true],
  ["Limited slots lang for this batch", true],
  ["Pang-share sa 3 PM merienda.", true],
  ["Isama sa balikbayan box ngayong Pasko.", true],
];

let failed = 0;
for (const [text, shouldPass] of cases) {
  const passed = lintText(text).length === 0;
  const ok = passed === shouldPass;
  if (!ok) failed++;
  console.log(`${ok ? "ok  " : "FAIL"} ${shouldPass ? "pass" : "fail"}  ${text}`);
}

const same = similarity("3 AM break. Antok na. Sili Mango.", "3 AM break. Antok na. Try Sili Mango.");
const diff = similarity("3 AM break. Antok na. Sili Mango.", "Isama sa balikbayan box.");
const simOk = same > 0.5 && diff < 0.2;
if (!simOk) failed++;
console.log(`${simOk ? "ok  " : "FAIL"} similarity same=${same.toFixed(2)} diff=${diff.toFixed(2)}`);

const slang = heuristicCritic("Lodi, petmalu 'to! Werpa, sana all, charot.");
const plain = heuristicCritic("Snack na hindi chips. Mangga from Cebu na may sili.");
const critOk = !slang.passed && plain.passed;
if (!critOk) failed++;
console.log(`${critOk ? "ok  " : "FAIL"} slang critic`);

console.log(failed ? `\n${failed} failed` : `\nall ${cases.length + 2} passed`);
process.exit(failed ? 1 : 0);
