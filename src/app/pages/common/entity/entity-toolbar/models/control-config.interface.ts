import { CoreEvent } from 'app/interfaces/events';
import { Subject } from 'rxjs';

export interface ControlConfig {
  name: string;
  label: string;
  labelIcon?: string;
  labelIconType?: string;
  color?: string;
  type: string;
  disabled: boolean;
  value?: any;
  options?: any[];
  placeholder?: string;
}

export interface ToolbarConfig {
  controls: any[]; // ControlConfig[];
  target: Subject<CoreEvent>;
}
