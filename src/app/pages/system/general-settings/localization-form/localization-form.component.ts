import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import _ from 'lodash';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { Option } from 'app/interfaces/option.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/ix-forms/classes/simple-async-combobox-provider';
import { IxComboboxProvider } from 'app/modules/ix-forms/components/ix-combobox/ix-combobox-provider';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { LanguageService, SystemGeneralService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LocaleService } from 'app/services/locale.service';
import { AppState } from 'app/store';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';

@UntilDestroy()
@Component({
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LocalizationFormComponent {
  fieldsetTitle = helptext.localeTitle;

  isFormLoading = false;

  sortLanguagesByName = true;

  formGroup: UntypedFormGroup = this.fb.group({
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
    private fb: UntypedFormBuilder,
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
    this.ws.call('system.general.update', [body]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.store$.dispatch(generalConfigUpdated());
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.slideInService.close();
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
