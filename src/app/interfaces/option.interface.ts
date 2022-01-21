export interface Option {
  label: string;
  value: string | number;
}

export interface RadioOption extends Option {
  tooltip: string;
}
