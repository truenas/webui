import { TranslateService } from '@ngx-translate/core';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getBootenvFormConfig, BootenvFormValues } from 'app/pages/system/bootenv/bootenv-form/bootenv.form-config';

describe('getBootenvFormConfig', () => {
  const allValues = { source: 'original', target: 'cloned' } as BootenvFormValues;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds a clone request scoped to the source boot environment', () => {
    const definition = getBootenvFormConfig(api, translate, 'original');
    definition.submit({
      isEdit: false,
      allValues,
      changedValues: allValues,
    } as FormSubmitEvent<BootenvFormValues>);

    expect(api.call).toHaveBeenCalledWith('boot.environment.clone', [
      { id: 'original', target: 'cloned' },
    ]);
  });
});
