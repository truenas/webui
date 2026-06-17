import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { filter, of, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { GlobalTwoFactorConfig, GlobalTwoFactorConfigUpdate } from 'app/interfaces/two-factor-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface GlobalTwoFactorFormValues {
  enabled: boolean;
  window: number | null;
  ssh: boolean;
}

export function getGlobalTwoFactorFormConfig(
  api: ApiService,
  translate: TranslateService,
  dialogService: DialogService,
  authService: AuthService,
  router: Router,
  window: Window,
  twoFactorConfig: GlobalTwoFactorConfig,
): FormDefinition<GlobalTwoFactorFormValues> {
  const enableWarning = translate.instant('Once enabled, users will be prompted to set up two-factor authentication next time they login. They can choose to skip the setup if desired.');

  return {
    title: T('Global Two Factor Authentication'),
    requiredRoles: [Role.SystemSecurityWrite],
    fields: [
      {
        name: 'enabled',
        type: 'checkbox',
        label: T('Enable Two Factor Authentication Globally'),
        hint: twoFactorConfig.enabled ? undefined : enableWarning,
        // Stable id targeted by system-security-form's deep-link scroll/highlight.
        id: 'enable-2fa-global',
      },
      {
        name: 'window',
        type: 'input',
        inputType: 'number',
        label: T('Window'),
        required: true,
      },
      {
        name: 'ssh',
        type: 'checkbox',
        label: T('Enable Two Factor Authentication for SSH'),
        // Stable id targeted by system-security-form's deep-link scroll/highlight.
        id: 'enable-2fa-ssh',
      },
    ],
    submit: (event) => {
      const values = event.allValues;
      const payload: GlobalTwoFactorConfigUpdate = {
        enabled: values.enabled,
        services: { ssh: values.ssh },
        window: Number(values.window),
      };

      const shouldWarn = twoFactorConfig.enabled && values.enabled;
      const confirmation$ = shouldWarn
        ? dialogService.confirm({
            title: translate.instant('Warning!'),
            message: translate.instant('Changing global 2FA settings might cause user secrets to reset. Which means users will have to reconfigure their 2FA. Are you sure you want to continue?'),
          })
        : of(true);

      return {
        request$: confirmation$.pipe(
          filter(Boolean),
          switchMap(() => api.call('auth.twofactor.update', [payload])),
        ),
        successMessage: translate.instant('Settings saved'),
        onSuccess: () => {
          window.localStorage.setItem('showQr2FaWarning', `${values.enabled}`);
          authService.globalTwoFactorConfigUpdated();
          if (!isEqual(twoFactorConfig, payload) && payload.enabled) {
            router.navigate(['/two-factor-auth']);
          }
        },
      };
    },
  };
}
