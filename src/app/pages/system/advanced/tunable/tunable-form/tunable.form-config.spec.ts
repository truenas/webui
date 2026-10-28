import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Tunable } from 'app/interfaces/tunable.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getTunableFormConfig } from 'app/pages/system/advanced/tunable/tunable-form/tunable.form-config';

describe('getTunableFormConfig', () => {
  const api = { call: jest.fn(() => of({})), job: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds a create request when no tunable is being edited', () => {
    const allValues = {
      type: 'UDEV',
      var: 'some.var',
      value: '42',
      comment: 'Answer to the question',
      enabled: true,
    } as Tunable;
    const definition = getTunableFormConfig(api, translate, undefined);
    definition.submit({ isEdit: false, allValues, changedValues: allValues } as FormSubmitEvent<Tunable>);

    expect(api.job).toHaveBeenCalledWith('tunable.create', [{
      type: 'UDEV',
      var: 'some.var',
      value: '42',
      comment: 'Answer to the question',
      enabled: true,
    }]);
  });

  it('builds an update request scoped to the edited tunable id', () => {
    const allValues = {
      type: 'SYSCTL',
      var: 'var.exist',
      value: 'New value',
      comment: 'Existing variable',
      enabled: true,
    } as Tunable;
    const definition = getTunableFormConfig(api, translate, { id: 1 } as Tunable);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<Tunable>);

    expect(api.job).toHaveBeenCalledWith('tunable.update', [
      1,
      {
        comment: 'Existing variable',
        enabled: true,
        value: 'New value',
      },
    ]);
  });
});
