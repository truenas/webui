import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export interface NvidiaDriversFormValues {
  nvidia: boolean;
}

export function getNvidiaDriversFormConfig(
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
  nvidiaEnabled: boolean,
): FormDefinition<NvidiaDriversFormValues> {
  return {
    title: T('NVIDIA Drivers'),
    requiredRoles: [Role.SystemAdvancedWrite],
    fields: [
      {
        name: 'nvidia',
        type: 'checkbox',
        label: T('Enable NVIDIA GPU Support'),
        tooltip: T('Enable NVIDIA GPU support for containers and VMs.'),
        value: nvidiaEnabled,
      },
    ],
    submit: (event) => ({
      request$: api.call('system.advanced.update', [{ nvidia: event.allValues.nvidia }]),
      successMessage: translate.instant('Settings saved'),
      onSuccess: () => store$.dispatch(advancedConfigUpdated()),
    }),
  };
}
