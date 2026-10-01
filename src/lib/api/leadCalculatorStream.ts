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

type CalculatorEvent = {
  type: "step" | "result";
  statusCode?: number;
  error?: string;
  details?: string[];
  result?: LeadCalculatorResult;
};

export async function calculateLeadFunnel(
  accessToken: string,
  scenario: LeadCalculatorScenario,
): Promise<LeadCalculatorResult> {
  const response = await fetch(LEAD_CALCULATOR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ action: "calculate", schemaVersion: 1, scenario }),
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

  if (!result || result.statusCode !== 200 || !result.result) {
    throw new Error(result?.error || "The calculator could not complete this scenario.");
  }

  return result.result;
}
