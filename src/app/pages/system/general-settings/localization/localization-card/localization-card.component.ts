import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnCardHeaderDirective,
  TnListComponent,
  TnListItemComponent,
  TnButtonComponent,
  TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { localizationCardElements } from 'app/pages/system/general-settings/localization/localization-card/localization-card.elements';
import { getLocalizationFormConfig } from 'app/pages/system/general-settings/localization/localization-form/localization.form-config';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-localization-card',
  styleUrls: ['./../../common-settings-card.scss'],
  templateUrl: './localization-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnListComponent,
    TnListItemComponent,
    UiSearchDirective,
    WithLoadingStateDirective,
    TranslateModule,
    TnButtonComponent,
    TnCardFooterActionsDirective,
    RequiresRolesDirective,
  ],
})
export class LocalizationCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private formPanel = inject(FormSidePanelService);
  private sysGeneralService = inject(SystemGeneralService);
  private authService = inject(AuthService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);

  protected readonly searchableElements = localizationCardElements;
  protected readonly requiredRoles = [Role.SystemGeneralWrite];

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  protected rawConfig = toSignal(this.store$.pipe(waitForGeneralConfig));

  readonly mapChoices$ = this.sysGeneralService.kbdMapChoices().pipe(
    toLoadingState(),
  );

  readonly helptext = helptext;

  getKeyboardMapValue(mapChoices: Option[], config: SystemGeneralConfig): string {
    const keyboardMap = mapChoices.find((option) => option.value === config.kbdmap);
    return config.kbdmap && keyboardMap?.label ? keyboardMap.label : helptext.default;
  }

  openSettings(config: SystemGeneralConfig): void {
    this.formPanel.openForm(
      getLocalizationFormConfig(this.sysGeneralService, this.api, this.translate, this.store$),
      {
        title: this.translate.instant('Localization Settings'),
        editData: {
          kbdmap: config.kbdmap,
          timezone: config.timezone,
        },
      },
    );
  }
}
