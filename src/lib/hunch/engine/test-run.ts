import type { Mode, ProductInput, TestEvent, TestRun } from "../types";
import { claudeModel, type ModelClient } from "./agents/model";
import { createMockModel } from "./agents/mock-model";
import { runPipeline } from "./agents/pipeline";
import { isMockModel } from "./mode";
import { startReplay, type ReplayOptions } from "./replay";
import { sampleRunFor } from "./sample/run";

export { sampleRunFor };

type Emit = (e: TestEvent) => void | Promise<void>;

export function liveModel(): ModelClient {
  return isMockModel() ? createMockModel({ delayMs: 250 }) : claudeModel;
}

// Live: the agent pipeline. Sample: a sample seller's run replayed over 25-35 s. The caller sends the final "done" line.
export async function runTest(
  input: ProductInput,
  emit: Emit,
  mode: Mode,
  deps: { model?: ModelClient; replay?: ReplayOptions } = {},
): Promise<TestRun> {
  if (mode === "live") return runPipeline(input, emit, { model: deps.model ?? liveModel() });
  return startReplay(sampleRunFor(input), emit, deps.replay).done;
}
