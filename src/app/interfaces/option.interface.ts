export interface Option {
  label: string;
  value: string | number;
}

export type MapOption = [
  value: string,
  label: string,
];

export interface RadioOption extends Option {
  tooltip: string;
}
