// cspell:ignore debugkernel
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getKernelFormConfig, KernelFormValues } from 'app/pages/system/advanced/kernel/kernel-form/kernel.form-config';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

describe('getKernelFormConfig', () => {
  const allValues = { debugkernel: true } as KernelFormValues;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const store$ = { dispatch: jest.fn() } as unknown as Store;

  beforeEach(() => jest.clearAllMocks());

  it('builds an update request from all values', () => {
    const definition = getKernelFormConfig(api, translate, store$);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<KernelFormValues>);

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [allValues]);
  });

  it('dispatches advancedConfigUpdated on success', () => {
    const definition = getKernelFormConfig(api, translate, store$);
    const result = definition.submit({
      isEdit: true, allValues, changedValues: allValues,
    } as FormSubmitEvent<KernelFormValues>);

    result.onSuccess?.(undefined);

    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
  });
});
