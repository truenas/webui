import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox2/ix-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { LanguageService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { AppState } from 'app/store';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  selector: 'localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationFormComponent {
  fieldsetTitle = helptext.localeTitle;

  isFormLoading = false;

  sortLanguagesByName = true;

  formGroup: FormGroup = this.fb.group({
    language: [''],
    kbdmap: [''],
    timezone: [''],
    date_format: [''],
    time_format: [''],
  });

  language: {
    readonly fcName: 'language';
    label: string;
    tooltip: string;
    provider: IxComboboxProvider;
    options: Option[];
  } = {
    fcName: 'language',
    label: helptext.stg_language.placeholder,
    tooltip: helptext.stg_language.tooltip,
    options: null,
    provider: {
      fetch: (search: string): Observable<Option[]> => {
        if (this.language.options && this.language.options.length) {
          return of(this.filter(this.language.options, search));
        }
        return this.sysGeneralService.languageOptions(this.sortLanguagesByName).pipe(
          tap((options: Option[]) => {
            this.language.options = options;
          }),
          map((options: Option[]) => {
            return this.filter(options, search);
          }),
        );
      },
      nextPage: (): Observable<Option[]> => of([]),
    },
  };

  kbdMap: {
    readonly fcName: 'kbdmap';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
  } = {
    fcName: 'kbdmap',
    label: helptext.stg_kbdmap.placeholder,
    tooltip: helptext.stg_kbdmap.tooltip,
    options: this.sysGeneralService.kbdMapChoices(),
  };

  timezone: {
    readonly fcName: 'timezone';
    label: string;
    tooltip: string;
    options: Option[];
    provider: IxComboboxProvider;
  } = {
    fcName: 'timezone',
    label: helptext.stg_timezone.placeholder,
    tooltip: helptext.stg_timezone.tooltip,
    options: null,
    provider: {
      fetch: (search: string): Observable<Option[]> => {
        if (this.timezone.options && this.timezone.options.length) {
          return of(this.filter(this.timezone.options, search));
        }
        return this.sysGeneralService.timezoneChoices().pipe(
          map((tzChoices) => _.sortBy(tzChoices, [(option) => option.label.toLowerCase()])),
          tap((options: Option[]) => this.timezone.options = options),
          map((options: Option[]) => this.filter(options, search)),
        );
      },
      nextPage: (): Observable<Option[]> => of([]),
    },
  };

  filter(options: Option[], search: string): Option[] {
    if (options && options.length) {
      if (search) {
        return options.filter((option: Option) => {
          return option.label.toLowerCase().includes(search.toLowerCase())
              || option.value.toString().toLowerCase().includes(search.toLowerCase());
        });
      }
      return [...options];
    }
    return [];
  }

  dateFormat: {
    readonly fcName: 'date_format';
    label: string;
    tooltip: string;
    options?: Observable<Option[]>;
  } = {
    fcName: 'date_format',
    label: helptext.date_format.placeholder,
    tooltip: helptext.date_format.tooltip,
  };

  timeFormat: {
    readonly fcName: 'time_format';
    label: string;
    tooltip: string;
    options?: Observable<Option[]>;
  } = {
    fcName: 'time_format',
    label: helptext.time_format.placeholder,
    tooltip: helptext.time_format.tooltip,
  };

  constructor(
    private sysGeneralService: SystemGeneralService,
    private fb: FormBuilder,
    public localeService: LocaleService,
    protected ws: WebSocketService,
    protected langService: LanguageService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
  ) { }

  setTimeOptions(tz: string): void {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    this.timeFormat.options = of(timeOptions);
    const dateOptions = this.localeService.getDateFormatOptions(tz);
    this.dateFormat.options = of(dateOptions);
  }

  setupForm(localizationSettings: LocalizationSettings): void {
    this.setTimeOptions(localizationSettings.timezone);
    this.formGroup.patchValue({
      language: localizationSettings.language,
      kbdmap: localizationSettings.kbdMap,
      timezone: localizationSettings.timezone,
      date_format: localizationSettings.dateFormat,
      time_format: localizationSettings.timeFormat,
    });
  }

  submit(): void {
    const body = this.formGroup.value;
    this.isFormLoading = true;
    this.store$.dispatch(localizationFormSubmitted({
      dateFormat: body.date_format,
      timeFormat: body.time_format,
    }));
    delete body.date_format;
    delete body.time_format;
    this.ws.call('system.general.update', [body]).pipe(untilDestroyed(this)).subscribe(() => {
      this.store$.dispatch(generalConfigUpdated());
      this.isFormLoading = false;
      this.cdr.markForCheck();
      this.slideInService.close();
      this.setTimeOptions(body.timezone);
      this.langService.setLanguage(body.language);
    }, (error) => {
      this.isFormLoading = false;
      this.errorHandler.handleWsFormError(error, this.formGroup);
      this.cdr.markForCheck();
    });
  }
}
