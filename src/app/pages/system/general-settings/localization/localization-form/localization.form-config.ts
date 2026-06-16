import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TnSelectOption } from '@truenas/ui-components';
import { sortBy } from 'lodash-es';
import { map } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';

export interface LocalizationFormValues {
  kbdmap: string;
  timezone: string;
}

export function getLocalizationFormConfig(
  sysGeneralService: SystemGeneralService,
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
  editingSettings: LocalizationSettings | undefined,
): FormDefinition<LocalizationFormValues> {
  return {
    title: T('Localization Settings'),
    requiredRoles: [],
    sections: [{
      title: helptext.localeTitle,
      fields: [
        {
          name: 'kbdmap',
          type: 'select',
          label: helptext.kbdmap.label,
          required: true,
          value: editingSettings?.kbdMap ?? '',
          options: sysGeneralService.kbdMapChoices().pipe(
            map((choices) => choices.map((choice): TnSelectOption => ({ label: choice.label, value: choice.value }))),
          ),
        },
        {
          name: 'timezone',
          type: 'combobox',
          label: helptext.timezone.label,
          required: true,
          requireSelection: true,
          value: editingSettings?.timezone ?? '',
          options: sysGeneralService.timezoneChoices().pipe(
            map((choices) => sortBy(choices, [(choice) => choice.label.toLowerCase()])),
            map((choices) => choices.map((choice): TnSelectOption => ({ label: choice.label, value: choice.value }))),
          ),
        },
      ],
    }],
    submit: (event) => ({
      request$: api.call('system.general.update', [event.allValues]),
      successMessage: translate.instant('Localization settings updated'),
      onSuccess: () => {
        store$.dispatch(generalConfigUpdated());
        store$.dispatch(systemInfoUpdated());
      },
    }),
  };
}
