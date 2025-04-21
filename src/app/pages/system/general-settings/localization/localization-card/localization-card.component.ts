import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { defaultLanguage, languages } from 'app/constants/languages.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { LocaleService } from 'app/modules/language/locale.service';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { localizationCardElements } from 'app/pages/system/general-settings/localization/localization-card/localization-card.elements';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-localization-card',
  templateUrl: './localization-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    TranslateModule,
    MapValuePipe,
  ],
})
export class LocalizationCardComponent {
  protected readonly searchableElements = localizationCardElements;
  protected readonly requiredRoles = [Role.SystemGeneralWrite];
  protected readonly languages = languages;

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  readonly mapChoices$ = this.sysGeneralService.kbdMapChoices().pipe(
    toLoadingState(),
  );

  readonly userPreferences$ = this.store$.pipe(waitForPreferences);

  readonly currentLanguage$ = this.userPreferences$.pipe(
    map((prefs) => prefs.language || defaultLanguage),
    toLoadingState(),
  );

  readonly currentLanguage = toSignal(this.userPreferences$.pipe(
    map((prefs) => prefs.language || defaultLanguage),
  ));

  readonly helptext = helptext;

  constructor(
    public localeService: LocaleService,
    private store$: Store<AppState>,
    private slideIn: SlideIn,
    private sysGeneralService: SystemGeneralService,
  ) {}

  getKeyboardMapValue(mapChoices: Option[], config: SystemGeneralConfig): string {
    const keyboardMap = mapChoices.find((option) => option.value === config.kbdmap);
    return config.kbdmap && keyboardMap?.label ? keyboardMap.label : helptext.default;
  }

  openSettings(config: SystemGeneralConfig): void {
    this.slideIn.open(LocalizationFormComponent, {
      data: {
        kbdMap: config.kbdmap,
        timezone: config.timezone,
        language: this.currentLanguage(),
        dateFormat: this.localeService.getPreferredDateFormat(),
        timeFormat: this.localeService.getPreferredTimeFormat(),
      },
    });
  }
}
