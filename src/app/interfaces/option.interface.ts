export interface Option {
  label: string;
  value: string | number;
}

export type MapOption = [
  value: string,
  label: string,
];

export interface RadioOption {
  label: string;
  value: string | number | boolean;
  tooltip?: string;
}
