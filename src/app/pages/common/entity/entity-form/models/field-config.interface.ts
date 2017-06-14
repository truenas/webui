import { ValidatorFn } from '@angular/forms';

export interface FieldConfig {
  disabled?: boolean,
  label?: string,
  name: string,
  options?: any[],
  placeholder?: string,
  type: string,
  inputType?: string,
  validation?: any[]|ValidatorFn|ValidatorFn[],
  value?: any,
  multiple?: boolean,
}
