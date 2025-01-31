export interface CpuParams {
  usageMin: number;
  usageMax: number;
  usageMinThreads: number[];
  usageMaxThreads: number[];
  tempMin: number;
  tempMax: number;
  tempMinCores: number[];
  tempMaxCores: number[];
}
