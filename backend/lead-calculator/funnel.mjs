const MAX_LEADS = 10_000_000;
const MAX_STAGES = 12;
const EPSILON = 1e-10;

export class InputError extends Error {
  constructor(message, details = [], phase = "validation") {
    super(message);
    this.name = "InputError";
    this.details = details;
    this.phase = phase;
  }
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finiteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function checkNumber(errors, value, path, { min = 0, max = Number.MAX_SAFE_INTEGER, exclusiveMin = false } = {}) {
  if (!finiteNumber(value) || (exclusiveMin ? value <= min : value < min) || value > max) {
    errors.push(`${path} must be a finite number ${exclusiveMin ? "greater than" : "at least"} ${min}${Number.isFinite(max) ? ` and at most ${max}` : ""}.`);
  }
}

function roundCurrency(value) {
  return Number(value.toFixed(2));
}

function largestRemainder(total, shares) {
  const exact = shares.map((share) => total * share);
  const counts = exact.map(Math.floor);
  let remaining = total - counts.reduce((sum, count) => sum + count, 0);
  const order = exact.map((value, index) => ({ index, remainder: value - counts[index] }))
    .sort((a, b) => b.remainder - a.remainder || a.index - b.index);
  for (let i = 0; i < remaining; i += 1) counts[order[i].index] += 1;
  return counts;
}

function validateScenario(scenario) {
  const errors = [];
  if (!isRecord(scenario)) throw new InputError("Invalid scenario", ["scenario must be an object."]);
  if (scenario.mode !== "forward" && scenario.mode !== "reverse") errors.push("scenario.mode must be 'forward' or 'reverse'.");
  if (!Array.isArray(scenario.stages) || scenario.stages.length < 2 || scenario.stages.length > MAX_STAGES) {
    errors.push(`scenario.stages must contain 2 to ${MAX_STAGES} ordered stages.`);
  }
  if (errors.length) throw new InputError("Invalid scenario", errors);

  const seenNames = new Set();
  scenario.stages.forEach((stage, index) => {
    const path = `scenario.stages[${index}]`;
    if (!isRecord(stage)) { errors.push(`${path} must be an object.`); return; }
    if (typeof stage.name !== "string" || !stage.name.trim() || stage.name.length > 60) errors.push(`${path}.name must be 1 to 60 characters.`);
    else if (seenNames.has(stage.name.trim().toLocaleLowerCase())) errors.push(`${path}.name must be unique.`);
    else seenNames.add(stage.name.trim().toLocaleLowerCase());
    if (index < scenario.stages.length - 1) {
      if (!finiteNumber(stage.conversionRate) || stage.conversionRate < 0 || stage.conversionRate > 1) errors.push(`${path}.conversionRate must be between 0 and 1 (a fraction, not a percentage).`);
    } else if (stage.conversionRate !== undefined && stage.conversionRate !== null) {
      errors.push(`${path}.conversionRate must be omitted for the final stage because it has no next stage.`);
    }
    if (stage.owner !== undefined && !["marketing", "sales", "shared", "other"].includes(stage.owner)) errors.push(`${path}.owner must be marketing, sales, shared, or other.`);
    if (stage.daysInStage !== undefined && (!finiteNumber(stage.daysInStage) || stage.daysInStage < 0 || stage.daysInStage > 3650)) errors.push(`${path}.daysInStage must be between 0 and 3650.`);
    if (stage.benchmarkRate !== undefined && (!finiteNumber(stage.benchmarkRate) || stage.benchmarkRate < 0 || stage.benchmarkRate > 1)) errors.push(`${path}.benchmarkRate must be between 0 and 1.`);
    if (stage.atRiskAfterDays !== undefined && (!finiteNumber(stage.atRiskAfterDays) || stage.atRiskAfterDays < 0 || stage.atRiskAfterDays > 3650)) errors.push(`${path}.atRiskAfterDays must be between 0 and 3650.`);
  });

  if (scenario.mode === "forward") {
    checkNumber(errors, scenario.startingLeads, "scenario.startingLeads", { min: 1, max: MAX_LEADS });
    if (!Number.isInteger(scenario.startingLeads)) errors.push("scenario.startingLeads must be a whole number of leads.");
  }
  if (scenario.mode === "reverse") checkNumber(errors, scenario.revenueGoal, "scenario.revenueGoal", { min: 0, max: 1_000_000_000_000, exclusiveMin: true });
  if (!Number.isInteger(scenario.periodMonths) || scenario.periodMonths < 1 || scenario.periodMonths > 120) errors.push("scenario.periodMonths must be a whole number from 1 to 120.");

  if (!isRecord(scenario.revenue)) errors.push("scenario.revenue must define deal value.");
  else if (scenario.revenue.type === "one_time") checkNumber(errors, scenario.revenue.amount, "scenario.revenue.amount", { min: 0, max: 1_000_000_000, exclusiveMin: true });
  else if (scenario.revenue.type === "subscription") {
    checkNumber(errors, scenario.revenue.monthlyAmount, "scenario.revenue.monthlyAmount", { min: 0, max: 1_000_000_000, exclusiveMin: true });
    checkNumber(errors, scenario.revenue.expectedRetentionMonths, "scenario.revenue.expectedRetentionMonths", { min: 0, max: 1200, exclusiveMin: true });
  } else if (isRecord(scenario.revenue)) errors.push("scenario.revenue.type must be one_time or subscription.");

  if (scenario.confidenceDelta !== undefined && (!finiteNumber(scenario.confidenceDelta) || scenario.confidenceDelta < 0 || scenario.confidenceDelta > 0.5)) errors.push("scenario.confidenceDelta must be between 0 and 0.5; it is an absolute percentage-point adjustment to each stage rate.");
  if (scenario.channels !== undefined) {
    if (!Array.isArray(scenario.channels) || scenario.channels.length < 1 || scenario.channels.length > 20) errors.push("scenario.channels must contain 1 to 20 channels.");
    else {
      let shareTotal = 0;
      const channelNames = new Set();
      scenario.channels.forEach((channel, index) => {
        const path = `scenario.channels[${index}]`;
        if (!isRecord(channel)) { errors.push(`${path} must be an object.`); return; }
        if (typeof channel.name !== "string" || !channel.name.trim() || channel.name.length > 60) errors.push(`${path}.name must be 1 to 60 characters.`);
        else if (channelNames.has(channel.name.trim().toLocaleLowerCase())) errors.push(`${path}.name must be unique.`);
        else channelNames.add(channel.name.trim().toLocaleLowerCase());
        if (!finiteNumber(channel.share) || channel.share < 0 || channel.share > 1) errors.push(`${path}.share must be between 0 and 1.`);
        else shareTotal += channel.share;
        if (channel.conversionRates !== undefined && (!Array.isArray(channel.conversionRates) || channel.conversionRates.length !== scenario.stages.length - 1 || channel.conversionRates.some((rate) => !finiteNumber(rate) || rate < 0 || rate > 1))) errors.push(`${path}.conversionRates must provide one 0-to-1 rate for each stage transition.`);
        if (channel.costPerLead !== undefined && (!finiteNumber(channel.costPerLead) || channel.costPerLead < 0 || channel.costPerLead > 1_000_000)) errors.push(`${path}.costPerLead must be between 0 and 1000000.`);
      });
      if (Math.abs(shareTotal - 1) > 0.000001) errors.push("Channel shares must sum to 1.0 (100%).");
    }
  }
  if (scenario.costPerLead !== undefined && (!finiteNumber(scenario.costPerLead) || scenario.costPerLead < 0 || scenario.costPerLead > 1_000_000)) errors.push("scenario.costPerLead must be between 0 and 1000000.");
  if (scenario.reengagement !== undefined) {
    if (!isRecord(scenario.reengagement)) errors.push("scenario.reengagement must be an object.");
    else {
      if (!finiteNumber(scenario.reengagement.eligibleShare) || scenario.reengagement.eligibleShare < 0 || scenario.reengagement.eligibleShare > 1) errors.push("scenario.reengagement.eligibleShare must be between 0 and 1.");
      if (!finiteNumber(scenario.reengagement.conversionRate) || scenario.reengagement.conversionRate < 0 || scenario.reengagement.conversionRate > 1) errors.push("scenario.reengagement.conversionRate must be between 0 and 1.");
    }
  }
  if (scenario.quota !== undefined && (!isRecord(scenario.quota) || !Number.isInteger(scenario.quota.reps) || scenario.quota.reps < 1 || scenario.quota.reps > 100_000)) errors.push("scenario.quota.reps must be a whole number from 1 to 100000.");
  if (scenario.leadsPerAccount !== undefined && (!finiteNumber(scenario.leadsPerAccount) || scenario.leadsPerAccount < 1 || scenario.leadsPerAccount > 100_000)) errors.push("scenario.leadsPerAccount must be between 1 and 100000.");
  if (scenario.grossMargin !== undefined && (!finiteNumber(scenario.grossMargin) || scenario.grossMargin <= 0 || scenario.grossMargin > 1)) errors.push("scenario.grossMargin must be greater than 0 and at most 1 when supplied.");
  if (scenario.startMonth !== undefined && (!Number.isInteger(scenario.startMonth) || scenario.startMonth < 0 || scenario.startMonth > 11)) errors.push("scenario.startMonth must be an integer from 0 (January) to 11 (December).");
  if (scenario.seasonality !== undefined && (!Array.isArray(scenario.seasonality) || scenario.seasonality.length !== 12 || scenario.seasonality.some((value) => !finiteNumber(value) || value < 0 || value > 10) || scenario.seasonality.every((value) => value === 0))) errors.push("scenario.seasonality must contain 12 nonnegative monthly multipliers, with at least one value above zero and no value above 10.");
  if (scenario.seasonality !== undefined && Array.isArray(scenario.seasonality) && scenario.seasonality.length === 12 && Number.isInteger(scenario.periodMonths) && scenario.periodMonths > 0 && scenario.periodMonths <= 120 && Number.isInteger(scenario.startMonth ?? 0) && (scenario.startMonth ?? 0) >= 0 && (scenario.startMonth ?? 0) <= 11) {
    const selectedMonths = Array.from({ length: scenario.periodMonths }, (_, offset) => scenario.seasonality[((scenario.startMonth ?? 0) + offset) % 12]);
    if (selectedMonths.reduce((sum, value) => sum + value, 0) <= 0) errors.push("The selected planning window must include at least one month with a positive seasonality multiplier.");
  }
  if (errors.length) throw new InputError("Invalid scenario", errors);
  return scenario;
}

function customerRevenue(revenue) {
  return revenue.type === "subscription" ? revenue.monthlyAmount * revenue.expectedRetentionMonths : revenue.amount;
}

function transitionRates(scenario, channel, adjustment) {
  const rawRates = channel.conversionRates ?? scenario.stages.slice(0, -1).map((stage) => stage.conversionRate);
  return rawRates.map((rate) => Math.min(1, Math.max(0, rate + adjustment)));
}

function advanceVolumes(initialVolume, rates) {
  const volumes = [initialVolume];
  rates.forEach((rate) => volumes.push(volumes[volumes.length - 1] * rate));
  return volumes;
}

function stageResultsCumulativeRate(stageVolume, channelResults) {
  const initialLeads = channelResults.reduce((sum, channel) => sum + channel.stageVolumes[0], 0);
  return initialLeads > 0 ? stageVolume / initialLeads : null;
}

function solve(scenario, adjustment = 0) {
  const channels = scenario.channels ?? [{ name: "All channels", share: 1 }];
  const revenuePerCustomer = customerRevenue(scenario.revenue);
  const ratesByChannel = channels.map((channel) => transitionRates(scenario, channel, adjustment));
  let leadCounts;

  if (scenario.mode === "forward") {
    leadCounts = largestRemainder(scenario.startingLeads, channels.map((channel) => channel.share));
  } else {
    const targetCustomers = scenario.revenueGoal / revenuePerCustomer;
    const blendedWinRate = channels.reduce((sum, channel, index) => {
      const finalRate = ratesByChannel[index].reduce((product, rate) => product * rate, 1);
      return sum + channel.share * finalRate;
    }, 0);
    if (blendedWinRate <= 0) throw new InputError("The revenue goal cannot be reached with these assumptions.", ["At least one channel must have a nonzero probability of completing every transition."], "calculation");
    let totalRequiredLeads = Math.ceil(targetCustomers / blendedWinRate - EPSILON);
    if (!Number.isSafeInteger(totalRequiredLeads) || totalRequiredLeads > MAX_LEADS) throw new InputError("The required lead volume is too large.", [`The calculated requirement exceeds the ${MAX_LEADS.toLocaleString()} lead limit.`], "calculation");
    // Channel-level integer allocation can differ slightly from the blended
    // expectation for small volumes. Raise the total until its allocated mix
    // actually meets the requested revenue goal.
    while (true) {
      const allocated = largestRemainder(totalRequiredLeads, channels.map((channel) => channel.share));
      const expectedWins = allocated.reduce((sum, count, index) => sum + count * ratesByChannel[index].reduce((product, rate) => product * rate, 1), 0);
      if (expectedWins * revenuePerCustomer + EPSILON >= scenario.revenueGoal) break;
      totalRequiredLeads += 1;
      if (totalRequiredLeads > MAX_LEADS) throw new InputError("The required lead volume is too large.", [`The calculated requirement exceeds the ${MAX_LEADS.toLocaleString()} lead limit.`], "calculation");
    }
    leadCounts = largestRemainder(totalRequiredLeads, channels.map((channel) => channel.share));
  }

  const hasCostAssumptions = finiteNumber(scenario.costPerLead) || channels.some((channel) => finiteNumber(channel.costPerLead));
  const channelResults = channels.map((channel, index) => {
    const leads = leadCounts[index];
    const rates = ratesByChannel[index];
    const volumes = advanceVolumes(leads, rates);
    const lost = volumes.slice(0, -1).map((volume, i) => Math.max(0, volume - volumes[i + 1]));
    const reengageable = scenario.reengagement ? lost.reduce((sum, volume) => sum + volume * scenario.reengagement.eligibleShare, 0) : 0;
    const reengagedCustomers = scenario.reengagement ? reengageable * scenario.reengagement.conversionRate : 0;
    const costPerLead = channel.costPerLead ?? scenario.costPerLead;
    return {
      name: channel.name,
      share: channel.share,
      leads,
      stageVolumes: volumes,
      transitionRates: rates,
      expectedCustomers: volumes[volumes.length - 1],
      expectedRevenue: volumes[volumes.length - 1] * revenuePerCustomer,
      estimatedCost: costPerLead === undefined ? null : leads * costPerLead,
      reengageableLeads: reengageable,
      expectedReengagedCustomers: reengagedCustomers,
      expectedReengagedRevenue: reengagedCustomers * revenuePerCustomer,
    };
  });

  const totals = channelResults.reduce((sum, channel) => ({
    leads: sum.leads + channel.leads,
    expectedCustomers: sum.expectedCustomers + channel.expectedCustomers,
    expectedRevenue: sum.expectedRevenue + channel.expectedRevenue,
    estimatedCost: sum.estimatedCost + (channel.estimatedCost ?? 0),
    reengageableLeads: sum.reengageableLeads + channel.reengageableLeads,
    expectedReengagedCustomers: sum.expectedReengagedCustomers + channel.expectedReengagedCustomers,
    expectedReengagedRevenue: sum.expectedReengagedRevenue + channel.expectedReengagedRevenue,
  }), { leads: 0, expectedCustomers: 0, expectedRevenue: 0, estimatedCost: 0, reengageableLeads: 0, expectedReengagedCustomers: 0, expectedReengagedRevenue: 0 });

  const stageResults = scenario.stages.map((stage, index) => {
    const volume = channelResults.reduce((sum, channel) => sum + channel.stageVolumes[index], 0);
    const rates = channelResults.map((channel) => ({ volume: channel.stageVolumes[index], rate: channel.transitionRates[index] })).filter((item) => item.volume > 0);
    const conversionRate = index < scenario.stages.length - 1 && volume > 0
      ? rates.reduce((sum, item) => sum + item.volume * item.rate, 0) / rates.reduce((sum, item) => sum + item.volume, 0)
      : null;
    return {
      name: stage.name.trim(),
      owner: stage.owner ?? "unassigned",
      expectedVolume: volume,
      cumulativeConversionRate: stageResultsCumulativeRate(volume, channelResults),
      stageToStageConversionRate: conversionRate,
      benchmarkRate: stage.benchmarkRate ?? null,
      benchmarkDelta: stage.benchmarkRate !== undefined && conversionRate !== null ? conversionRate - stage.benchmarkRate : null,
      assumedDaysInStage: stage.daysInStage ?? null,
      durationThresholdDays: stage.atRiskAfterDays ?? null,
      durationAssumptionAtRisk: stage.daysInStage !== undefined && stage.atRiskAfterDays !== undefined ? stage.daysInStage > stage.atRiskAfterDays : false,
      expectedLostAtTransition: index < scenario.stages.length - 1
        ? Math.max(0, volume - channelResults.reduce((sum, channel) => sum + channel.stageVolumes[index + 1], 0))
        : 0,
    };
  });
  const expectedCycleDays = scenario.stages.reduce((sum, stage) => sum + (stage.daysInStage ?? 0), 0);
  const costPerAcquiredCustomer = hasCostAssumptions && totals.expectedCustomers > 0 ? totals.estimatedCost / totals.expectedCustomers : null;
  const monthlyRevenuePerCustomer = scenario.revenue.type === "subscription" ? scenario.revenue.monthlyAmount : null;
  const paybackMonths = monthlyRevenuePerCustomer && costPerAcquiredCustomer !== null && scenario.grossMargin !== undefined
    ? costPerAcquiredCustomer / (monthlyRevenuePerCustomer * scenario.grossMargin)
    : null;

  const startMonth = scenario.startMonth ?? 0;
  const monthlyWeights = scenario.seasonality
    ? Array.from({ length: scenario.periodMonths }, (_, offset) => scenario.seasonality[(startMonth + offset) % 12])
    : Array.from({ length: scenario.periodMonths }, () => 1);
  const weightsTotal = monthlyWeights.reduce((sum, value) => sum + value, 0);
  const monthlyRequiredLeads = scenario.mode === "reverse"
    ? largestRemainder(totals.leads, monthlyWeights.map((weight) => weight / weightsTotal))
    : null;
  const monthlyLeadPlan = monthlyWeights.map((weight, index) => ({
    period: index + 1,
    seasonalityMultiplier: weight,
    requiredLeads: scenario.mode === "reverse" ? monthlyRequiredLeads[index] : null,
    expectedLeads: scenario.mode === "forward" ? totals.leads * weight / weightsTotal : null,
  }));

  return {
    mode: scenario.mode,
    periodMonths: scenario.periodMonths,
    leads: totals.leads,
    requiredLeadsPerMonth: scenario.mode === "reverse" ? totals.leads / scenario.periodMonths : null,
    expectedCustomers: totals.expectedCustomers,
    expectedRevenue: roundCurrency(totals.expectedRevenue),
    revenuePerCustomer: roundCurrency(revenuePerCustomer),
    estimatedAccounts: scenario.leadsPerAccount !== undefined ? totals.leads / scenario.leadsPerAccount : null,
    leadsPerAccount: scenario.leadsPerAccount ?? null,
    stageResults,
    channelResults: channelResults.map((channel) => ({
      ...channel,
      expectedRevenue: roundCurrency(channel.expectedRevenue),
      estimatedCost: channel.estimatedCost === null ? null : roundCurrency(channel.estimatedCost),
      expectedReengagedRevenue: roundCurrency(channel.expectedReengagedRevenue),
    })),
    estimatedMarketingCost: hasCostAssumptions ? roundCurrency(totals.estimatedCost) : null,
    costPerAcquiredCustomer: costPerAcquiredCustomer === null ? null : roundCurrency(costPerAcquiredCustomer),
    paybackMonths: paybackMonths === null ? null : Number(paybackMonths.toFixed(2)),
    expectedCycleDays,
    reengagement: scenario.reengagement ? {
      expectedEligibleLeads: totals.reengageableLeads,
      expectedCustomers: totals.expectedReengagedCustomers,
      expectedRevenue: roundCurrency(totals.expectedReengagedRevenue),
      includedInPrimaryRevenue: false,
    } : null,
    quota: scenario.quota ? {
      reps: scenario.quota.reps,
      requiredLeadsPerRepPerMonth: scenario.mode === "reverse" ? totals.leads / (scenario.quota.reps * scenario.periodMonths) : null,
      expectedCustomersPerRepPerMonth: scenario.mode === "forward" ? totals.expectedCustomers / (scenario.quota.reps * scenario.periodMonths) : null,
    } : null,
    monthlyLeadPlan,
    confidenceBand: null,
  };
}

export function calculateFunnel(rawScenario) {
  const scenario = validateScenario(rawScenario);
  const expected = solve(scenario);
  const delta = scenario.confidenceDelta ?? 0;
  const bandResult = (adjustment) => {
    try {
      const value = solve(scenario, adjustment);
      return { leads: value.leads, expectedCustomers: value.expectedCustomers, expectedRevenue: value.expectedRevenue };
    } catch (error) {
      if (scenario.mode === "reverse" && error instanceof InputError) {
        return { leads: null, expectedCustomers: 0, expectedRevenue: 0, goalAchievable: false, reason: error.message };
      }
      throw error;
    }
  };
  expected.confidenceBand = {
    adjustment: delta,
    interpretation: "Each transition probability is shifted by this absolute amount and clamped to 0..1. These are assumption scenarios, not statistical confidence intervals.",
    conservative: bandResult(-delta),
    expected: { leads: expected.leads, customers: expected.expectedCustomers, revenue: expected.expectedRevenue },
    optimistic: bandResult(delta),
  };
  return expected;
}
