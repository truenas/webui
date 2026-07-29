import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  finalize, forkJoin, map, Observable, of, take,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { FormDefinition } from 'app/modules/forms/ix-forms/components/ix-form-renderer/form-definition.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated, generalConfigUpdated, loginBannerUpdated } from 'app/store/system-config/system-config.actions';
import {
  waitForAdvancedConfig,
  waitForGeneralConfig,
} from 'app/store/system-config/system-config.selectors';

export interface AccessFormValues {
  ds_auth: boolean;
  login_banner: string;
}

export function getAccessFormConfig(
  api: ApiService,
  translate: TranslateService,
  store$: Store<AppState>,
  isEnterprise: () => boolean,
): FormDefinition<AccessFormValues> {
  return {
    title: T('Access Settings'),
    requiredRoles: [Role.AuthSessionsWrite],
    fields: [
      ...(isEnterprise()
        ? [{
            name: 'ds_auth' as const,
            type: 'checkbox' as const,
            label: T('Allow Directory Service users to access WebUI'),
          }]
        : []),
      {
        name: 'login_banner',
        type: 'textarea',
        label: T('Login Banner'),
        tooltip: T('When set, the following text will be shown prior to showing login page to the user'),
      },
    ],
    loadData: () => forkJoin([
      store$.pipe(waitForGeneralConfig, take(1)),
      store$.pipe(waitForAdvancedConfig, take(1)),
    ]).pipe(map(([general, advanced]) => ({
      ds_auth: general.ds_auth,
      login_banner: advanced.login_banner,
    }))),
    submit: (event) => {
      const bannerChanged = 'login_banner' in event.changedValues;
      const enterprise = isEnterprise();
      const requests$: Observable<unknown>[] = [];

      if (bannerChanged) {
        const loginBanner = event.allValues.login_banner || '';
        requests$.push(
          api.call('system.advanced.update', [{ login_banner: loginBanner }]).pipe(
            finalize(() => {
              store$.dispatch(advancedConfigUpdated());
              store$.dispatch(loginBannerUpdated({ loginBanner }));
            }),
          ),
        );
      }

      if (enterprise) {
        requests$.push(
          api.call('system.general.update', [{ ds_auth: event.allValues.ds_auth }]).pipe(
            finalize(() => store$.dispatch(generalConfigUpdated())),
          ),
        );
      }

      return {
        request$: requests$.length ? forkJoin(requests$) : of(null),
        successMessage: translate.instant('Settings saved'),
      };
    },
  };
}
