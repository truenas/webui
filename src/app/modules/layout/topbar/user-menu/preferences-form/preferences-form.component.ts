import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ThemeService } from 'app/modules/theme/theme.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { defaultPreferences } from 'app/store/preferences/default-preferences.constant';
import { guiFormSubmitted, lifetimeTokenUpdated,
  localizationFormSubmitted, themeChangedInGuiForm } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-preferences-form',
  templateUrl: './preferences-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxComboboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class PreferencesFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private themeService = inject(ThemeService);
  private localeService = inject(LocaleService);
  private langService = inject(LanguageService);
  private sysGeneralService = inject(SystemGeneralService);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected form = this.fb.nonNullable.group({
    theme: ['', [Validators.required]],
    language: ['', [Validators.required]],
    date_format: [''],
    time_format: [''],
    token_lifetime: [defaultPreferences.lifetime, [
      Validators.required,
      Validators.min(30),
      Validators.max(2147482),
    ]],
  });

  protected themeOptions = of(
    this.themeService.allThemes.map((theme) => ({ label: theme.label, value: theme.name })),
  );

  protected languageProvider = new SimpleAsyncComboboxProvider(
    this.sysGeneralService.languageOptions(true),
  );

  protected dateFormatOptions = of<Option[]>([]);
  protected timeFormatOptions = of<Option[]>([]);

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.setupThemePreview();
  }

  ngOnInit(): void {
    this.store$.pipe(waitForGeneralConfig, takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
      this.setTimeOptions(config.timezone);
    });

    this.store$.pipe(waitForPreferences, takeUntilDestroyed(this.destroyRef)).subscribe((preferences) => {
      this.form.patchValue({
        theme: preferences.userTheme,
        language: preferences.language || defaultPreferences.language,
        date_format: preferences.dateFormat || defaultPreferences.dateFormat,
        time_format: preferences.timeFormat || defaultPreferences.timeFormat,
        token_lifetime: preferences.lifetime || defaultPreferences.lifetime,
      });
    });
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();

    this.store$.dispatch(lifetimeTokenUpdated({ lifetime: values.token_lifetime }));
    this.store$.dispatch(guiFormSubmitted({ theme: values.theme }));
    this.themeService.updateThemeInLocalStorage(this.themeService.findTheme(values.theme));

    this.store$.dispatch(localizationFormSubmitted({
      dateFormat: values.date_format,
      timeFormat: values.time_format,
      language: values.language,
    }));
    this.window.localStorage.setItem('language', values.language);
    this.window.localStorage.setItem('dateFormat', values.date_format);
    this.window.localStorage.setItem('timeFormat', values.time_format);
    this.langService.setLanguage(values.language);

    this.snackbar.success(this.translate.instant('Preferences saved'));
    this.slideInRef.close({ response: true });
  }

  private setTimeOptions(tz: string): void {
    this.dateFormatOptions = of(this.localeService.getDateFormatOptions(tz));
    this.timeFormatOptions = of(this.localeService.getTimeFormatOptions(tz));
  }

  private setupThemePreview(): void {
    this.form.controls.theme.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((theme) => {
      this.store$.dispatch(themeChangedInGuiForm({ theme }));
    });
  }
}
