import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnAutocompleteComponent,
  TnButtonComponent,
  TnCheckboxComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnInputComponent,
  TnSelectComponent,
  TnSelectOption,
} from '@truenas/ui-components';
import {
  Subscription, merge, startWith,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LanguageService } from 'app/modules/language/language.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ThemeService } from 'app/modules/theme/theme.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
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
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnInputComponent,
    TnAutocompleteComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class PreferencesFormComponent extends SidePanelForm implements OnInit {
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

  private previewSubscription: Subscription;

  protected readonly form = this.fb.nonNullable.group({
    theme: ['', [Validators.required]],
    syncThemeWithOS: [false],
    lightTheme: [''],
    darkTheme: [''],
    language: ['', [Validators.required]],
    date_format: [''],
    time_format: [''],
    token_lifetime: [defaultPreferences.lifetime, [
      Validators.required,
      Validators.min(30),
      Validators.max(2147482),
    ]],
  });

  protected isSyncWithOs = toSignal(
    this.form.controls.syncThemeWithOS.valueChanges.pipe(startWith(false)),
    { initialValue: false },
  );

  protected readonly InputType = InputType;

  // tn-select renders labels verbatim, so pre-translate them (the old ix-select piped
  // every option label through translate at render).
  protected lightThemeOptions: TnSelectOption[] = translateOptions(
    this.translate,
    this.themeService.allThemes
      .filter((theme) => !this.themeService.isDarkTheme(theme.name))
      .map((theme) => ({ label: theme.label, value: theme.name })),
  );

  protected darkThemeOptions: TnSelectOption[] = translateOptions(
    this.translate,
    this.themeService.allThemes
      .filter((theme) => this.themeService.isDarkTheme(theme.name))
      .map((theme) => ({ label: theme.label, value: theme.name })),
  );

  protected themeOptions: TnSelectOption[] = translateOptions(
    this.translate,
    this.themeService.allThemes.map((theme) => ({ label: theme.label, value: theme.name })),
  );

  protected languageOptions = toSignal(
    this.sysGeneralService.languageOptions(true),
    { initialValue: [] as Option[] },
  );

  protected dateFormatOptions = signal<TnSelectOption[]>([]);
  protected timeFormatOptions = signal<TnSelectOption[]>([]);

  /** Submission is synchronous (store dispatches only), so there is no loading state. */
  readonly canSubmit = this.trackCanSubmit(signal(false));

  constructor() {
    super();
    this.setupThemePreview();
  }

  ngOnInit(): void {
    this.store$.pipe(waitForGeneralConfig, takeUntilDestroyed(this.destroyRef)).subscribe((config) => {
      this.setTimeOptions(config.timezone);
    });

    this.store$.pipe(waitForPreferences, takeUntilDestroyed(this.destroyRef)).subscribe((preferences) => {
      this.form.patchValue({
        theme: preferences.userTheme,
        syncThemeWithOS: preferences.syncThemeWithOS ?? false,
        lightTheme: preferences.lightTheme ?? defaultPreferences.lightTheme,
        darkTheme: preferences.darkTheme ?? defaultPreferences.darkTheme,
        language: preferences.language || defaultPreferences.language,
        date_format: preferences.dateFormat || defaultPreferences.dateFormat,
        time_format: preferences.timeFormat || defaultPreferences.timeFormat,
        token_lifetime: preferences.lifetime || defaultPreferences.lifetime,
      });
    });

    this.form.controls.syncThemeWithOS.valueChanges.pipe(
      startWith(this.form.controls.syncThemeWithOS.value),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((sync) => {
      const { theme, lightTheme, darkTheme } = this.form.controls;
      if (sync) {
        theme.clearValidators();
        lightTheme.setValidators([Validators.required]);
        darkTheme.setValidators([Validators.required]);
      } else {
        theme.setValidators([Validators.required]);
        lightTheme.clearValidators();
        darkTheme.clearValidators();
      }
      theme.updateValueAndValidity();
      lightTheme.updateValueAndValidity();
      darkTheme.updateValueAndValidity();
    });
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();

    this.previewSubscription.unsubscribe();
    this.store$.dispatch(lifetimeTokenUpdated({ lifetime: values.token_lifetime }));
    this.store$.dispatch(guiFormSubmitted({
      theme: values.theme,
      syncThemeWithOS: values.syncThemeWithOS,
      lightTheme: values.lightTheme,
      darkTheme: values.darkTheme,
    }));
    const effectiveTheme = values.syncThemeWithOS
      ? this.getOsTheme(values.lightTheme, values.darkTheme)
      : values.theme;
    this.themeService.updateThemeInLocalStorage(this.themeService.findTheme(effectiveTheme));

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
    this.close(true);
  }

  private setTimeOptions(tz: string): void {
    this.dateFormatOptions.set(this.localeService.getDateFormatOptions(tz));
    this.timeFormatOptions.set(this.localeService.getTimeFormatOptions(tz));
  }

  private getOsTheme(light: string, dark: string): string {
    return this.window.matchMedia('(prefers-color-scheme: dark)').matches ? dark : light;
  }

  private setupThemePreview(): void {
    const {
      theme,
      // eslint-disable-next-line @typescript-eslint/naming-convention -- "OS" acronym violates strictCamelCase
      syncThemeWithOS,
      lightTheme,
      darkTheme,
    } = this.form.controls;

    this.previewSubscription = merge(
      theme.valueChanges,
      syncThemeWithOS.valueChanges,
      lightTheme.valueChanges,
      darkTheme.valueChanges,
    ).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      const effectiveTheme = syncThemeWithOS.value
        ? this.getOsTheme(lightTheme.value, darkTheme.value)
        : theme.value;
      this.store$.dispatch(themeChangedInGuiForm({ theme: effectiveTheme }));
    });

    const mediaQuery = this.window.matchMedia('(prefers-color-scheme: dark)');
    const onOsThemeChange = (): void => {
      if (!syncThemeWithOS.value) {
        return;
      }
      const effectiveTheme = this.getOsTheme(lightTheme.value, darkTheme.value);
      this.store$.dispatch(themeChangedInGuiForm({ theme: effectiveTheme }));
    };
    mediaQuery.addEventListener('change', onOsThemeChange);
    this.destroyRef.onDestroy(() => mediaQuery.removeEventListener('change', onOsThemeChange));
  }
}
