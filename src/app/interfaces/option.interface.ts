export type BaseOptionValueType = string | number | null;
export type RadioOptionValueType = string | number | null | boolean;
export type SelectOptionValueType = string | number | null | string[] | number[] | [ number, string ];

export interface Option<T = BaseOptionValueType> {
  label: string;
  value: T;
}

export type MapOption = [
  value: string,
  label: string,
];

export interface RadioOption<T = RadioOptionValueType> extends Option<T> {
  tooltip?: string;
}

export interface SelectOption<T = SelectOptionValueType> extends Option<T> {
  disabled?: boolean;
  tooltip?: string;
  hoverTooltip?: string;
}

export interface ActionOption<T = BaseOptionValueType> extends Option<T> {
  action?: () => void;
}

export const newOption = 'NEW';
export const nullOption = 'NULL';
