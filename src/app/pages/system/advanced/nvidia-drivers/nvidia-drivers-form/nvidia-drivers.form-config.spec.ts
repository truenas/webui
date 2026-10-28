import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getNvidiaDriversFormConfig,
  NvidiaDriversFormValues,
} from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-form/nvidia-drivers.form-config';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

describe('getNvidiaDriversFormConfig', () => {
  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const store$ = { dispatch: jest.fn() } as unknown as Store<AppState>;

  beforeEach(() => jest.clearAllMocks());

  it('seeds the nvidia field with the current enabled state', () => {
    const definition = getNvidiaDriversFormConfig(api, translate, store$, true);

    expect(definition.fields[0]).toMatchObject({ name: 'nvidia', value: true });
  });

  it('builds an advanced.update request with the toggled nvidia value', () => {
    const definition = getNvidiaDriversFormConfig(api, translate, store$, false);
    const allValues = { nvidia: true } as NvidiaDriversFormValues;

    definition.submit({
      isEdit: true, allValues, changedValues: allValues,
    } as FormSubmitEvent<NvidiaDriversFormValues>);

    expect(api.call).toHaveBeenCalledWith('system.advanced.update', [{ nvidia: true }]);
  });

  it('dispatches advancedConfigUpdated on success', () => {
    const definition = getNvidiaDriversFormConfig(api, translate, store$, false);
    const allValues = { nvidia: true } as NvidiaDriversFormValues;

    definition.submit({
      isEdit: true, allValues, changedValues: allValues,
    } as FormSubmitEvent<NvidiaDriversFormValues>).onSuccess?.(null);

    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
  });
});
