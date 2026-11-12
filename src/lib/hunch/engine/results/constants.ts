// Winner rules from the build spec ("Results upload and winner logic").
export const CONFIDENCE = {
  high: { margin: 0.25, results: 10, linkClicks: 50 },
  medium: { margin: 0.1, results: 5, linkClicks: 20 },
} as const;

export const CAVEAT = {
  minTotalSpend: 400, // PHP
  closeRunnerUp: 0.1, // runner-up within 10%
  spendSpread: 0.2, // spend differs by more than 20%
  max: 3,
} as const;

export const CODES = ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"] as const;

export const EMPTY_EXPORT = "This export has no ad results yet.";
export const UNREADABLE_EXPORT = "We couldn't read this file. Type your numbers into the grid instead.";
export const NO_BREAKDOWN = "No breakdown in this export";
