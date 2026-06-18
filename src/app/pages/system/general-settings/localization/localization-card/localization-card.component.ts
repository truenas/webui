import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnListComponent,
  TnListItemComponent,
  type TnCardAction,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { localizationCardElements } from 'app/pages/system/general-settings/localization/localization-card/localization-card.elements';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
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
    TnListComponent,
    TnListItemComponent,
    UiSearchDirective,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class LocalizationCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private sysGeneralService = inject(SystemGeneralService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  protected readonly searchableElements = localizationCardElements;

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  private rawConfig = toSignal(this.store$.pipe(waitForGeneralConfig));

  readonly mapChoices$ = this.sysGeneralService.kbdMapChoices().pipe(
    toLoadingState(),
  );

  readonly helptext = helptext;

  private hasSettingsRole = toSignal(
    this.authService.hasRole([Role.SystemGeneralWrite]),
    { initialValue: false },
  );

  protected settingsAction = computed<TnCardAction | undefined>(() => {
    const config = this.rawConfig();
    if (!config || !this.hasSettingsRole()) {
      return undefined;
    }

    return {
      label: this.translate.instant('Settings'),
      testId: 'localization-settings',
      handler: () => this.openSettings(config),
    };
  });

  getKeyboardMapValue(mapChoices: Option[], config: SystemGeneralConfig): string {
    const keyboardMap = mapChoices.find((option) => option.value === config.kbdmap);
    return config.kbdmap && keyboardMap?.label ? keyboardMap.label : helptext.default;
  }

  openSettings(config: SystemGeneralConfig): void {
    this.slideIn.open(LocalizationFormComponent, {
      data: {
        kbdMap: config.kbdmap,
        timezone: config.timezone,
      },
    });
  }
}
