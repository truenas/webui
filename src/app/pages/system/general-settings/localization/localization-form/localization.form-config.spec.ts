import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getLocalizationFormConfig, LocalizationFormValues,
} from 'app/pages/system/general-settings/localization/localization-form/localization.form-config';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';

describe('getLocalizationFormConfig', () => {
  const allValues = {
    kbdmap: 'us',
    timezone: 'America/New_York',
  } as LocalizationFormValues;

  const sysGeneralService = {
    kbdMapChoices: () => of([]),
    timezoneChoices: () => of([]),
  } as unknown as SystemGeneralService;
  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const store$ = { dispatch: jest.fn() } as unknown as Store<AppState>;

  beforeEach(() => jest.clearAllMocks());

  it('builds a system.general.update request from the submitted values', () => {
    const definition = getLocalizationFormConfig(sysGeneralService, api, translate, store$);
    definition.submit({
      isEdit: true,
      allValues,
      changedValues: allValues,
    } as FormSubmitEvent<LocalizationFormValues>);

    expect(api.call).toHaveBeenCalledWith('system.general.update', [allValues]);
  });
});
