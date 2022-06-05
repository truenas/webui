import {
  AfterViewInit, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest } from 'rxjs';
import { take } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization-form/localization-form.component';
import { DataCard } from 'app/pages/system/interfaces/data-card.interface';
import { SystemGeneralService } from 'app/services';
import { IxSlideInService, ResponseOnClose } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { guiFormClosedWithoutSaving } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';
import { GuiFormComponent } from './gui-form/gui-form.component';

enum GeneralCardId {
  Gui = 'gui',
  Localization = 'localization',
  Ntp = 'ntp',
}

@UntilDestroy()
@Component({
  templateUrl: './general-settings.component.html',
})
export class GeneralSettingsComponent implements OnInit, AfterViewInit {
  dataCards: DataCard<GeneralCardId>[] = [];
  supportTitle = helptext.supportTitle;
  localeData: DataCard<GeneralCardId.Localization>;
  configData: SystemGeneralConfig;
  localizationSettings: LocalizationSettings;

  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  constructor(
    private localeService: LocaleService,
    private sysGeneralService: SystemGeneralService,
    private slideInService: IxSlideInService,
    private store$: Store<AppState>,
    private translate: TranslateService,
    private themeService: ThemeService,
    private layoutService: LayoutService,
  ) { }

  ngOnInit(): void {
    this.getDataCardData();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getDataCardData(): void {
    combineLatest([
      this.store$.pipe(waitForGeneralConfig),
      this.store$.pipe(waitForPreferences),
    ]).pipe(untilDestroyed(this)).subscribe(([config, preferences]) => {
      this.configData = config;
      this.dataCards = [
        {
          title: helptext.guiTitle,
          id: GeneralCardId.Gui,
          items: [
            { label: this.translate.instant('Theme'), value: preferences.userTheme },
            { label: helptext.ui_certificate.label, value: config.ui_certificate.name },
            { label: helptext.ui_address.label, value: config.ui_address.join(', ') },
            { label: helptext.ui_v6address.label, value: config.ui_v6address.join(', ') },
            { label: helptext.ui_port.label, value: config.ui_port },
            { label: helptext.ui_httpsport.label, value: config.ui_httpsport },
            { label: helptext.ui_httpsprotocols.label, value: config.ui_httpsprotocols.join(', ') },
            {
              label: helptext.ui_httpsredirect.label,
              value: config.ui_httpsredirect ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext.crash_reporting.label,
              value: config.crash_reporting ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext.usage_collection.label,
              value: config.usage_collection ? helptext.enabled : helptext.disabled,
            },
            {
              label: helptext.ui_consolemsg.label,
              value: config.ui_consolemsg ? helptext.enabled : helptext.disabled,
            },
          ],
        },
      ];

      this.sysGeneralService.languageChoices().pipe(untilDestroyed(this)).subscribe((languages) => {
        this.sysGeneralService.kbdMapChoices().pipe(untilDestroyed(this)).subscribe((mapchoices) => {
          const keyboardMap = mapchoices.find((option) => option.value === this.configData.kbdmap);
          const dateTime = this.localeService.getDateAndTime(config.timezone);
          this.localeData = {
            title: helptext.localeTitle,
            id: GeneralCardId.Localization,
            items: [
              { label: helptext.stg_language.placeholder, value: languages[config.language] },
              { label: helptext.date_format.placeholder, value: dateTime[0] },
              { label: helptext.time_format.placeholder, value: dateTime[1] },
              { label: helptext.stg_timezone.placeholder, value: config.timezone },
              { label: helptext.stg_kbdmap.placeholder, value: config.kbdmap ? keyboardMap.label : helptext.default },
            ],
          };
          this.localizationSettings = {
            language: config.language,
            kbdMap: config.kbdmap,
            timezone: config.timezone,
            dateFormat: this.localeService.getPreferredDateFormat(),
            timeFormat: this.localeService.getPreferredTimeFormat(),
          };
          this.dataCards.push(this.localeData);
        });
      });
    });
  }

  doAdd(name: GeneralCardId): void {
    switch (name) {
      case GeneralCardId.Gui:
        this.slideInService.open(GuiFormComponent);
        this.slideInService.onClose$.pipe(take(1), untilDestroyed(this)).subscribe(({ response }: ResponseOnClose) => {
          // TODO: Do not simplify. Refactor slideInService to be more like MatDialog.
          if (response === true) {
            return;
          }

          this.store$.dispatch(guiFormClosedWithoutSaving());
        });
        break;
      default:
        const localizationFormModal = this.slideInService.open(LocalizationFormComponent);
        localizationFormModal.setupForm(this.localizationSettings);
        break;
    }
  }
}
