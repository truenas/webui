import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AuditFormValues, getAuditFormConfig } from 'app/pages/system/advanced/audit/audit-form/audit.form-config';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

describe('getAuditFormConfig', () => {
  const allValues = {
    retention: 29,
    reservation: 99,
    quota: 99,
    quota_fill_warning: 79,
    quota_fill_critical: 94,
  } as AuditFormValues;

  const api = { call: jest.fn(() => of(undefined)) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;
  const store$ = { dispatch: jest.fn() } as unknown as Store<AppState>;

  beforeEach(() => jest.clearAllMocks());

  it('builds an audit.update request from the submitted values', () => {
    const definition = getAuditFormConfig(api, translate, store$);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<AuditFormValues>);

    expect(api.call).toHaveBeenCalledWith('audit.update', [allValues]);
  });

  it('dispatches advancedConfigUpdated on success', () => {
    const definition = getAuditFormConfig(api, translate, store$);
    const result = definition.submit({
      isEdit: true,
      allValues,
      changedValues: allValues,
    } as FormSubmitEvent<AuditFormValues>);

    result.onSuccess?.(undefined);

    expect(store$.dispatch).toHaveBeenCalledWith(advancedConfigUpdated());
  });
});
