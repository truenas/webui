export interface DynamicFormSchema {
  name: string;
  type: string;
  title?: string;
  show_if?: string[];
  default?: any;
  required?: boolean;
  value?: string;
  max_length?: number;
  min_length?: number;
  min?: number;
  max?: number;
  cidr?: boolean;
  private?: boolean;
  hidden?: boolean;
  show_subquestions_if?: any;
  editable?: boolean;
}
