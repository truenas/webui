export interface FormSelectOption {
  label: string;
  value: unknown;
  hiddenFromDisplay?: boolean;
  disable?: boolean;
  disabled?: boolean; // TODO: One of these is a typo.
  tooltip?: string;
}
