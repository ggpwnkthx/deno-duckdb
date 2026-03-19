/**
 * Coverage threshold checker for CI.
 *
 * Parses LCOV coverage data and fails if coverage falls below thresholds.
 */

const MIN_LINE_COVERAGE = 70;
const MIN_BRANCH_COVERAGE = 70;

interface CoverageData {
  linesFound: number;
  linesHit: number;
  branchesFound: number;
  branchesHit: number;
}

function parseLcov(content: string): CoverageData {
  let linesFound = 0;
  let linesHit = 0;
  let branchesFound = 0;
  let branchesHit = 0;

  for (const line of content.split("\n")) {
    if (line.startsWith("LH:")) {
      linesHit += parseInt(line.slice(3), 10) || 0;
    } else if (line.startsWith("LF:")) {
      linesFound += parseInt(line.slice(3), 10) || 0;
    } else if (line.startsWith("BRH:")) {
      branchesHit += parseInt(line.slice(4), 10) || 0;
    } else if (line.startsWith("BRF:")) {
      branchesFound += parseInt(line.slice(4), 10) || 0;
    }
  }

  return { linesFound, linesHit, branchesFound, branchesHit };
}

function calculatePercentage(hit: number, found: number): number {
  if (found === 0) return 100;
  return Math.round((hit / found) * 100);
}

const coverageFile = Deno.args[0] || "coverage/coverage.txt";
const content = await Deno.readTextFile(coverageFile);
const coverage = parseLcov(content);

const lineCoverage = calculatePercentage(coverage.linesHit, coverage.linesFound);
const branchCoverage = calculatePercentage(
  coverage.branchesHit,
  coverage.branchesFound,
);

console.log(
  `Line Coverage: ${lineCoverage}% (${coverage.linesHit}/${coverage.linesFound})`,
);
console.log(
  `Branch Coverage: ${branchCoverage}% (${coverage.branchesHit}/${coverage.branchesFound})`,
);

const errors: string[] = [];

if (lineCoverage < MIN_LINE_COVERAGE) {
  errors.push(
    `Line coverage ${lineCoverage}% is below minimum ${MIN_LINE_COVERAGE}%`,
  );
}

if (branchCoverage < MIN_BRANCH_COVERAGE) {
  errors.push(
    `Branch coverage ${branchCoverage}% is below minimum ${MIN_BRANCH_COVERAGE}%`,
  );
}

if (errors.length > 0) {
  console.error("\nCoverage thresholds not met:");
  for (const error of errors) {
    console.error(`  - ${error}`);
  }
  Deno.exit(1);
}

console.log("\nCoverage thresholds met!");
