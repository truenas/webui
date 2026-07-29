import { Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { greaterThanFg } from 'app/modules/forms/ix-forms/validators/validators';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';

export interface AuditFormValues {
  retention: number | null;
  reservation: number | null;
  quota: number | null;
  quota_fill_warning: number | null;
  quota_fill_critical: number | null;
}

export function getAuditFormConfig(
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
): FormDefinition<AuditFormValues> {
  return {
    title: T('Audit'),
    requiredRoles: [Role.SystemAuditWrite],
    formValidators: [
      greaterThanFg(
        'quota_fill_critical',
        ['quota_fill_warning'],
        translate.instant('Quota Fill Critical must be greater than Quota Fill Warning.'),
      ),
    ],
    fields: [
      {
        name: 'retention',
        type: 'input',
        inputType: 'number',
        label: T('Retention (in days)'),
        tooltip: helptext.retentionTooltip,
        required: true,
        validators: [Validators.min(1), Validators.max(30)],
      },
      {
        name: 'reservation',
        type: 'input',
        inputType: 'number',
        label: T('Reservation (in GiB)'),
        tooltip: helptext.reservationTooltip,
        required: true,
        validators: [Validators.min(0), Validators.max(100)],
      },
      {
        name: 'quota',
        type: 'input',
        inputType: 'number',
        label: T('Quota (in GiB)'),
        tooltip: helptext.quotaTooltip,
        required: true,
        validators: [Validators.min(0), Validators.max(100)],
      },
      {
        name: 'quota_fill_warning',
        type: 'input',
        inputType: 'number',
        label: T('Quota Fill Warning (in %)'),
        tooltip: helptext.quotaFillWarningTooltip,
        required: true,
        validators: [Validators.min(5), Validators.max(80)],
      },
      {
        name: 'quota_fill_critical',
        type: 'input',
        inputType: 'number',
        label: T('Quota Fill Critical (in %)'),
        tooltip: helptext.quotaFillCriticalTooltip,
        required: true,
        validators: [Validators.min(50), Validators.max(95)],
      },
    ],
    loadData: () => api.call('audit.config').pipe(map((config) => ({
      retention: config.retention,
      reservation: config.reservation,
      quota: config.quota,
      quota_fill_warning: config.quota_fill_warning,
      quota_fill_critical: config.quota_fill_critical,
    }))),
    submit: (event) => ({
      request$: api.call('audit.update', [event.allValues]),
      successMessage: translate.instant('Settings saved'),
      onSuccess: () => store$.dispatch(advancedConfigUpdated()),
    }),
  };
}
