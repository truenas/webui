export interface CommandOptions {
  debug?: boolean;
  config?: string;
  enable?: boolean;
  disable?: boolean;
  generate?: boolean;
  shelves?: string;
  reset?: boolean;
  list?: boolean;
  vdevdisksize?: number | string;
  vdevrepeats?: number | string;
  layout?: string;
  width?: number | string;
  vdevscenario?: string;
  disksize?: number | string;
  diskrepeats?: number | string;
  model?: string;
  assign?: string;
  showcontrollers?: boolean;
  showshelves?: boolean;
  controllers?: Record<string, { model: string; systemProduct: string }>;
  ip?: string;
  force?: boolean;
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
