const LEAD_CALCULATOR_URL =
  "https://57ik3mefe6d7h4fxhlkpts5qjq0twtum.lambda-url.us-east-1.on.aws/";

export interface LeadCalculatorScenario {
  mode: "forward" | "reverse";
  startingLeads?: number;
  revenueGoal?: number;
  periodMonths: number;
  revenue: { type: "one_time"; amount: number };
  stages: { name: string; conversionRate?: number }[];
}

export interface LeadCalculatorResult {
  mode: "forward" | "reverse";
  periodMonths: number;
  leads: number;
  expectedCustomers: number;
  expectedRevenue: number;
  revenuePerCustomer: number;
  expectedCycleDays: number;
  requiredLeadsPerMonth: number | null;
  monthlyLeadPlan: {
    period: number;
    seasonalityMultiplier: number;
    requiredLeads: number | null;
    expectedLeads: number | null;
  }[];
  stageResults: {
    name: string;
    expectedVolume: number;
    cumulativeConversionRate: number;
    stageToStageConversionRate: number | null;
  }[];
}

export interface LeadCalculatorCsvAnalysis {
  fileName: string;
  importedRows: number;
  uniqueLeads: number;
  duplicatesRemoved: number;
  coverage: Record<"email" | "company" | "phone", { count: number; percent: number }>;
  detectedColumns: Record<"email" | "company" | "phone", string | null>;
}

type CalculatorEvent = {
  type: "step" | "result";
  statusCode?: number;
  error?: string;
  details?: string[];
  result?: LeadCalculatorResult;
  csvAnalysis?: LeadCalculatorCsvAnalysis;
};

async function requestCalculator(accessToken: string, payload: Record<string, unknown>): Promise<CalculatorEvent> {
  const response = await fetch(LEAD_CALCULATOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ schemaVersion: 1, ...payload }),
  });

  if (!response.ok || !response.body) {
    throw new Error("The calculator could not be reached. Please try again.");
  }

  const text = await response.text();
  const events = text
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line) as CalculatorEvent;
      } catch {
        return null;
      }
    })
    .filter((event): event is CalculatorEvent => event !== null);
  const result = events.find((event) => event.type === "result");

  if (!result || result.statusCode !== 200) {
    throw new Error(result?.details?.join(" ") || result?.error || "The calculator could not complete this request.");
  }

  return result;
}

export async function calculateLeadFunnel(accessToken: string, scenario: LeadCalculatorScenario): Promise<LeadCalculatorResult> {
  const response = await requestCalculator(accessToken, { action: "calculate", scenario });
  if (!response.result) throw new Error("The calculator did not return a funnel result.");
  return response.result;
}

export async function analyzeLeadCsv(accessToken: string, fileName: string, text: string): Promise<LeadCalculatorCsvAnalysis> {
  const response = await requestCalculator(accessToken, { action: "analyze_csv", csv: { fileName, text } });
  if (!response.csvAnalysis) throw new Error("The calculator did not return CSV analysis.");
  return response.csvAnalysis;
}

export async function calculateLeadFunnelFromCsv(
  accessToken: string,
  scenario: LeadCalculatorScenario,
  fileName: string,
  text: string,
): Promise<{ result: LeadCalculatorResult; csvAnalysis: LeadCalculatorCsvAnalysis }> {
  const response = await requestCalculator(accessToken, { action: "calculate_from_csv", scenario, csv: { fileName, text } });
  if (!response.result || !response.csvAnalysis) throw new Error("The calculator did not return the CSV-backed estimate.");
  return { result: response.result, csvAnalysis: response.csvAnalysis };
}
