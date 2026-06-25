import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export interface KernelFormValues {
  debugkernel: boolean;
}

export function getKernelFormConfig(
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
): FormDefinition<KernelFormValues> {
  return {
    title: T('Kernel'),
    requiredRoles: [Role.SystemAdvancedWrite],
    fields: [
      {
        name: 'debugkernel',
        type: 'checkbox',
        label: T('Enable Debug Kernel'),
        tooltip: helptextSystemAdvanced.debugKernelTooltip,
      },
    ],
    submit: (event) => ({
      request$: api.call('system.advanced.update', [event.allValues]),
      successMessage: translate.instant('Settings saved'),
      onSuccess: () => store$.dispatch(advancedConfigUpdated()),
    }),
  };
}
