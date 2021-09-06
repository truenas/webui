export interface FormSelectOption {
  label: string;
  value: any;
  hiddenFromDisplay?: boolean;
  disable?: boolean;
  disabled?: boolean; // TODO: One of these is a typo.
}
