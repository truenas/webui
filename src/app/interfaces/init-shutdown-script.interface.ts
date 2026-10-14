import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface InitShutdownScript {
  command: string;
  comment: string;
  enabled: boolean;
  id: number;
  script: string;
  timeout: number;
  type: InitShutdownScriptType;
  when: InitShutdownScriptWhen;
}

/**
 * Reads an `initshutdownscript.query` row. Middleware spells `type` and `when` as literals, and leaves the
 * defaulted fields optional and `command` / `script` nullable.
 */
export function toInitShutdownScript(script: WebUiQueryEntity<'initshutdownscript.query'>): InitShutdownScript {
  return script as unknown as InitShutdownScript;
}
