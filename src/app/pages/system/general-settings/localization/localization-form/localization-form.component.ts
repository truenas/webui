import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Inject, OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { omit, sortBy } from 'lodash-es';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { Option } from 'app/interfaces/option.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { localizationFormSubmitted } from 'app/store/preferences/preferences.actions';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-localization-form',
  templateUrl: './localization-form.component.html',
  styleUrls: ['./localization-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxComboboxComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class LocalizationFormComponent implements OnInit {
  fieldsetTitle = helptext.localeTitle;

  isFormLoading = signal<boolean>(false);

  sortLanguagesByName = true;
  protected localizationSettings: LocalizationSettings;

  formGroup = this.fb.nonNullable.group({
    language: ['', [Validators.required]],
    kbdmap: [''],
    timezone: ['', [Validators.required]],
    date_format: [''],
    time_format: [''],
  });

  protected language = {
    fcName: 'language',
    label: helptext.language.label,
    tooltip: helptext.language.tooltip,
    hint: helptext.language.hint,
    provider: new SimpleAsyncComboboxProvider(this.sysGeneralService.languageOptions(this.sortLanguagesByName)),
  };

  protected kbdMap = {
    fcName: 'kbdmap',
    label: helptext.kbdmap.label,
    options: this.sysGeneralService.kbdMapChoices(),
  };

  protected timezone = {
    fcName: 'timezone',
    label: helptext.timezone.label,
    provider: new SimpleAsyncComboboxProvider(this.sysGeneralService.timezoneChoices().pipe(map(
      (tzChoices) => sortBy(tzChoices, [(option) => option.label.toLowerCase()]),
    ))),
  };

  protected dateFormat = {
    fcName: 'date_format',
    label: helptext.dateFormat.label,
    options: of<Option[]>([]),
  };

  protected timeFormat = {
    fcName: 'time_format',
    label: helptext.timeFormat.label,
    options: of<Option[]>([]),
  };

  protected isEnterprise$ = this.store$.select(selectIsEnterprise);

  constructor(
    private sysGeneralService: SystemGeneralService,
    private fb: FormBuilder,
    public localeService: LocaleService,
    protected api: ApiService,
    protected langService: LanguageService,
    private errorHandler: FormErrorHandlerService,
    private store$: Store<AppState>,
    public slideInRef: SlideInRef<LocalizationSettings, boolean>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.formGroup.dirty);
    });

    this.localizationSettings = this.slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.localizationSettings) {
      this.setupForm();
    }
  }

  private setTimeOptions(tz: string): void {
    const timeOptions = this.localeService.getTimeFormatOptions(tz);
    this.timeFormat.options = of(timeOptions);
    const dateOptions = this.localeService.getDateFormatOptions(tz);
    this.dateFormat.options = of(dateOptions);
  }

  protected setupForm(): void {
    this.setTimeOptions(this.localizationSettings.timezone);
    this.formGroup.patchValue({
      language: this.localizationSettings.language,
      kbdmap: this.localizationSettings.kbdMap,
      timezone: this.localizationSettings.timezone,
      date_format: this.localizationSettings.dateFormat,
      time_format: this.localizationSettings.timeFormat,
    });
  }

  protected submit(): void {
    const values = this.formGroup.getRawValue();
    this.isFormLoading.set(true);
    this.window.localStorage.setItem('language', values.language);
    this.window.localStorage.setItem('dateFormat', values.date_format);
    this.window.localStorage.setItem('timeFormat', values.time_format);
    this.store$.dispatch(localizationFormSubmitted({
      dateFormat: values.date_format,
      timeFormat: values.time_format,
      language: values.language,
    }));

    const payload = omit(values, ['date_format', 'time_format', 'language']);

    this.api.call('system.general.update', [payload]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.store$.dispatch(generalConfigUpdated());
        this.store$.dispatch(systemInfoUpdated());
        this.isFormLoading.set(false);
        this.slideInRef.close({ response: true });
        this.langService.setLanguage(values.language);
        this.setTimeOptions(payload.timezone);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.errorHandler.handleValidationErrors(error, this.formGroup);
      },
    });
  }
}
