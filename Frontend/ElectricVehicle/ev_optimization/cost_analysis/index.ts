export interface CostEstimateParams {
  energyKWh: number;
  pricePerKWh?: number;
  taxRate?: number;
  serviceFee?: number;
}

export interface CostEstimateOutput {
  baseEnergyCost: number;
  taxAmount: number;
  serviceFee: number;
  totalSessionCost: number;
  currency: string;
  pricePerKWh: number;
}

export interface MonthlyCostSummaryOutput {
  month: string;
  year: number;
  totalSessions: number;
  totalEnergyKWh: number;
  totalCost: number;
  avgCostPerSession: number;
  avgCostPerKWh: number;
  savingsVsPetrol: number;
  recentSessions: any[];
}
