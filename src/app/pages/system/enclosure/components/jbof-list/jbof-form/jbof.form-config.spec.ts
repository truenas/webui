import { TranslateService } from '@ngx-translate/core';
import { Jbof } from 'app/interfaces/jbof.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getJbofFormConfig } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof.form-config';

describe('getJbofFormConfig', () => {
  const allValues = {
    description: 'new description',
    mgmt_ip1: '11.11.11.11',
    mgmt_ip2: '12.12.12.12',
    mgmt_username: 'admin',
    mgmt_password: 'qwerty',
  } as Partial<Jbof>;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds a create request when no jbof is being edited', () => {
    const definition = getJbofFormConfig(api, translate, undefined);
    definition.submit({ isEdit: false, allValues, changedValues: allValues } as FormSubmitEvent<Partial<Jbof>>);

    expect(api.call).toHaveBeenCalledWith('jbof.create', [allValues]);
  });

  it('builds an update request scoped to the edited jbof id', () => {
    const definition = getJbofFormConfig(api, translate, { id: 131 } as Jbof);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<Partial<Jbof>>);

    expect(api.call).toHaveBeenCalledWith('jbof.update', [131, allValues]);
  });
});
