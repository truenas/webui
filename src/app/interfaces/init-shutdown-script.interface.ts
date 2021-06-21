import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';

export interface InitShutdownScript {
  command: string;
  comment: string;
  enabled: boolean;
  id: number;
  script: string;
  script_text: string;
  timeout: number;
  type: InitShutdownScriptType;
  when: InitShutdownScriptWhen;
}
