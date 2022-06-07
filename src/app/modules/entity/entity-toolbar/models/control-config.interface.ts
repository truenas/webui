import { Subject } from 'rxjs';
import { ConfirmOptions } from 'app/interfaces/dialog.interface';
import { CoreEvent } from 'app/interfaces/events';

export interface ControlConfig {
  name: string;
  label?: string;
  labelIcon?: string;
  labelIconType?: string;
  color?: string;
  type: string;
  disabled?: boolean;
  value?: any;
  options?: any[];
  placeholder?: string;
  customTriggerValue?: string;
  required?: boolean;
  zeroStateMessage?: string;
  multiple?: boolean;
  selectedValue?: any;
  tooltip?: string;
  class?: string;
  min?: number;
  max?: number;
  step?: number;
  ixAutoIdentifier?: string;
  confirmOptions?: ConfirmOptions;
}

export interface ToolbarConfig {
  controls: ControlConfig[];
  target: Subject<CoreEvent>;
}
