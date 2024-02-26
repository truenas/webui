export interface SummaryItem {
  label: string;
  value: string;
}

export type SummarySection = SummaryItem[];

export interface SummaryProvider {
  getSummary(): SummarySection;
}
