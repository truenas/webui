import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import { DataCard } from 'app/pages/system/interfaces/data-card.interface';
import { SystemGeneralService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { AppState } from 'app/store';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

const localization = 'localization';

@UntilDestroy()
@Component({
  selector: 'ix-localization-card',
  templateUrl: './localization-card.component.html',
  styleUrls: ['./localization-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationCardComponent implements OnInit {
  cardTitle = helptext.localeTitle;
  card: DataCard<typeof localization>;
  localizationSettings: LocalizationSettings;

  constructor(
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private localeService: LocaleService,
    private sysGeneralService: SystemGeneralService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    combineLatest([
      this.store$.pipe(waitForGeneralConfig),
      this.store$.pipe(waitForPreferences),
    ]).pipe(untilDestroyed(this)).subscribe(([config]) => {
      this.sysGeneralService.languageChoices().pipe(untilDestroyed(this)).subscribe((languages) => {
        this.sysGeneralService.kbdMapChoices().pipe(untilDestroyed(this)).subscribe((mapchoices) => {
          const keyboardMap = mapchoices.find((option) => option.value === config.kbdmap);
          const keyboardMapLabel = config.kbdmap && keyboardMap?.label ? keyboardMap.label : helptext.default;
          const dateTime = this.localeService.getDateAndTime(config.timezone);
          this.localizationSettings = {
            language: config.language,
            kbdMap: config.kbdmap,
            timezone: config.timezone,
            dateFormat: this.localeService.getPreferredDateFormat(),
            timeFormat: this.localeService.getPreferredTimeFormat(),
          };

          this.card = {
            title: this.cardTitle,
            id: localization,
            items: [
              { label: helptext.stg_language.placeholder, value: languages[config.language] },
              { label: helptext.date_format.placeholder, value: dateTime[0] },
              { label: helptext.time_format.placeholder, value: dateTime[1] },
              { label: helptext.stg_timezone.placeholder, value: config.timezone },
              { label: helptext.stg_kbdmap.placeholder, value: keyboardMapLabel },
            ],
          };
          this.cdr.markForCheck();
        });
      });
    });
  }

  doAdd(): void {
    const localizationFormModal = this.slideInService.open(LocalizationFormComponent);
    localizationFormModal.setupForm(this.localizationSettings);
  }
}
