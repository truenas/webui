import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  FormBuilder, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { Option } from 'app/interfaces/option.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox-provider';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { LanguageService } from 'app/services/language.service';
import { LocaleService } from 'app/services/locale.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';

@UntilDestroy()
@Component({
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationFormComponent implements OnInit {
  fieldsetTitle = helptext.localeTitle;

  isFormLoading = false;

  sortLanguagesByName = true;

  formGroup = this.fb.group({
    language: ['', [Validators.required]],
    kbdmap: [''],
    timezone: ['', [Validators.required]],
    date_format: [''],
    time_format: [''],
  });

  language: {
    readonly fcName: 'language';
    label: string;
    tooltip: string;
    provider: SimpleAsyncComboboxProvider;
  } = {
    fcName: 'language',
    label: helptext.stg_language.placeholder,
    tooltip: helptext.stg_language.tooltip,
    provider: new SimpleAsyncComboboxProvider(this.sysGeneralService.languageOptions(this.sortLanguagesByName)),
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
    provider: IxComboboxProvider;
  } = {
    fcName: 'timezone',
    label: helptext.stg_timezone.placeholder,
    tooltip: helptext.stg_timezone.tooltip,
    provider: new SimpleAsyncComboboxProvider(this.sysGeneralService.timezoneChoices().pipe(map(
      (tzChoices) => _.sortBy(tzChoices, [(option) => option.label.toLowerCase()]),
    ))),
  };

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
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    private slideInRef: IxSlideInRef<LocalizationFormComponent>,
    @Inject(WINDOW) private window: Window,
    @Inject(SLIDE_IN_DATA) private localizationSettings: LocalizationSettings,
  ) { }

  ngOnInit(): void {
    if (this.localizationSettings) {
      this.setupForm();
    }
  }

  setTimeOptions(tz: string): void {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    this.timeFormat.options = of(timeOptions);
    const dateOptions = this.localeService.getDateFormatOptions(tz);
    this.dateFormat.options = of(dateOptions);
  }

  setupForm(): void {
    this.setTimeOptions(this.localizationSettings.timezone);
    this.formGroup.patchValue({
      language: this.localizationSettings.language,
      kbdmap: this.localizationSettings.kbdMap,
      timezone: this.localizationSettings.timezone,
      date_format: this.localizationSettings.dateFormat,
      time_format: this.localizationSettings.timeFormat,
    });
  }

  submit(): void {
    const body = this.formGroup.value;
    this.isFormLoading = true;
    this.window.localStorage.setItem('language', body.language);
    this.window.localStorage.setItem('dateFormat', body.date_format);
    this.window.localStorage.setItem('timeFormat', body.time_format);
    this.store$.dispatch(localizationFormSubmitted({
      dateFormat: body.date_format,
      timeFormat: body.time_format,
    }));
    delete body.date_format;
    delete body.time_format;
    this.ws.call('system.general.update', [body]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.store$.dispatch(generalConfigUpdated());
        this.store$.dispatch(systemInfoUpdated());
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInRef.close();
        this.setTimeOptions(body.timezone);
        this.langService.setLanguage(body.language);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.formGroup);
        this.cdr.markForCheck();
      },
    });
  }
}
