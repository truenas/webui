import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getSelfEncryptingDriveFormConfig, SedFormValues,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive.form-config';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

describe('getSelfEncryptingDriveFormConfig', () => {
  const allValues = {
    sed_passwd: 'pleasechange', sed_passwd2: 'pleasechange',
  } as SedFormValues;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const store$ = { dispatch: jest.fn() } as unknown as Store;

  beforeEach(() => jest.clearAllMocks());

  it('builds an update request stripping the confirmation field', () => {
    const definition = getSelfEncryptingDriveFormConfig(api, translate, store$);
    definition.submit({ isEdit: false, allValues, changedValues: allValues } as FormSubmitEvent<SedFormValues>);

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [
      { sed_passwd: 'pleasechange' },
    ]);
  });

  it('dispatches advancedConfigUpdated on success', () => {
    const definition = getSelfEncryptingDriveFormConfig(api, translate, store$);
    const result = definition.submit({
      isEdit: false, allValues, changedValues: allValues,
    } as FormSubmitEvent<SedFormValues>);

    result.onSuccess?.(undefined);

    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
  });
});
