import { Subject } from 'rxjs';
import { CoreEvent } from 'app/core/services/core.service';

export interface ControlConfig {
  name:string;
  label:string;
  labelIcon?:string;
  labelIconType?:string;
  color?: string;
  type:string;
  disabled:boolean;
  value?:any;
  options?:any[];
  placeholder?: string
}

export interface ToolbarConfig {
  controls: any[]; //ControlConfig[];
  target: Subject<CoreEvent>;
}
