import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-localization-card',
  templateUrl: './localization-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationCardComponent {
  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  readonly languages$ = this.sysGeneralService.languageChoices().pipe(
    toLoadingState(),
  );

  readonly mapChoices$ = this.sysGeneralService.kbdMapChoices().pipe(
    toLoadingState(),
  );

  readonly helptext = helptext;

  constructor(
    public localeService: LocaleService,
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private sysGeneralService: SystemGeneralService,
  ) {}

  getKeyboardMapValue(mapChoices: Option[], config: SystemGeneralConfig): string {
    const keyboardMap = mapChoices.find((option) => option.value === config.kbdmap);
    return config.kbdmap && keyboardMap?.label ? keyboardMap.label : helptext.default;
  }

  doAdd(config: SystemGeneralConfig): void {
    this.slideInService.open(LocalizationFormComponent, {
      data: {
        language: config.language,
        kbdMap: config.kbdmap,
        timezone: config.timezone,
        dateFormat: this.localeService.getPreferredDateFormat(),
        timeFormat: this.localeService.getPreferredTimeFormat(),
      },
    });
  }
}
