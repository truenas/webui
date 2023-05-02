export interface CommandOptions {
  [p: string]: any;
}

export interface ReportOptions {
  data?: unknown;
  showHeader: boolean;
  showFooter: boolean;
}

export interface Headers {
  header: string;
  footer: string;
}
