import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, input, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnAutocompleteComponent, TnAutocompleteOption, TnCheckboxComponent, TnDateInputComponent, TnDialog,
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import {
  Subject, debounceTime, distinctUntilChanged, filter, map, startWith, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { helptextApiKeys } from 'app/helptext/api-keys';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { newOption, Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { UserPickerProvider } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker-provider';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  KeyCreatedDialog,
} from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';
import { UserFormComponent } from 'app/pages/credentials/users/user-form/user-form.component';

@Component({
  selector: 'ix-api-key-form',
  templateUrl: './api-key-form.component.html',
  styleUrls: ['./api-key-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnAutocompleteComponent,
    TnCheckboxComponent,
    TnDateInputComponent,
    ReactiveFormsModule,
    TranslateModule,
  ],
})
export class ApiKeyFormComponent extends IxFormHostForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private tnDialog = inject(TnDialog);
  private api = inject(ApiService);
  private authService = inject(AuthService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  /** API key being edited; absent when adding. Supplied by the `<tn-side-panel>` host. */
  readonly editingKey = input<ApiKey | undefined>(undefined);
  /** Pre-selected username (e.g. opened from a user's access card). */
  readonly presetUsername = input<string | undefined>(undefined);

  protected readonly minDateToday = new Date();
  protected readonly editingRow = signal<ApiKey | undefined>(undefined);
  protected readonly isNew = computed(() => !this.editingRow());
  protected readonly requiredRoles = [Role.ApiKeyWrite, Role.SharingAdmin, Role.ReadonlyAdmin];
  protected readonly isFullAdmin = toSignal(this.authService.hasRole([Role.FullAdmin]));
  protected readonly isAllowedToReset = computed(
    () => this.username() === this.form.value.username || this.isFullAdmin(),
  );

  protected readonly currentUsername$ = this.authService.user$.pipe(
    filter((user) => !!user),
    map((user) => user.pw_name),
  );

  protected readonly username = toSignal(this.currentUsername$);
  protected readonly tooltips = {
    reset: helptextApiKeys.reset.tooltip,
    nonExpiring: helptextApiKeys.nonExpiring.tooltip,
  };

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    username: ['', [Validators.required]],
    expires_at: [null as Date | null],
    nonExpiring: [true],
    reset: [false],
  });

  protected readonly userQueryParams = new ParamsBuilder<User>()
    .filter('roles', '!=', [])
    .setOptions({ select: ['username', 'id', 'uid'], order_by: ['username'] })
    .getParams();

  protected readonly userPickerProvider = new UserPickerProvider({
    queryParams: this.userQueryParams,
  });

  /**
   * Options behind the username `tn-autocomplete`, refreshed on each search and appended to as
   * the open dropdown is scrolled. The first row is always "Add New", which opens the user form.
   */
  protected readonly usernameOptions = signal<TnAutocompleteOption<string>[]>([]);
  protected readonly usernamesLoading = signal(false);

  private readonly usernameSearch$ = new Subject<string>();

  /** The term the currently loaded page was fetched with, replayed by {@link onUsernameLoadMore}. */
  private lastUsernameSearch = '';

  /** The username selected before "Add New" was picked, restored when the user form is cancelled. */
  private previousUsername = '';

  /**
   * The options are already filtered server-side by {@link userPickerProvider}, so the component's
   * own client-side pass is disabled — it would otherwise hide results the query matched on a field
   * other than the label, and drop the "Add New" row as soon as the user typed.
   */
  protected readonly showAllOptions = (): boolean => true;

  protected readonly forbiddenNames$ = this.api.call('api_key.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(map((keys) => keys.map((key) => key.name)));

  ngOnInit(): void {
    const editingKey = this.editingKey();

    if (editingKey) {
      this.editingRow.set(editingKey);
      this.form.patchValue({
        ...editingKey,
        expires_at: editingKey.expires_at?.$date
          ? new Date(editingKey.expires_at.$date)
          : null,
        nonExpiring: !editingKey.expires_at?.$date,
      });
      this.form.controls.username.disable();
    } else {
      this.addForbiddenNamesValidator();

      const presetUsername = this.presetUsername();
      if (presetUsername) {
        this.form.patchValue({ username: presetUsername });
      } else {
        this.setCurrentUsername();
      }
    }
    this.handleNonExpiringChanges();
    this.loadUsernameOptions();
    this.listenForAddNewUser();
  }

  protected handleSubmit = (): SubmitResult<boolean, ApiKey> => {
    const {
      name, username, reset, nonExpiring,
    } = this.form.getRawValue();

    const expiresAtValue = this.form.value.expires_at;
    const expiresAt = (nonExpiring || !expiresAtValue)
      ? null
      : { $date: expiresAtValue.getTime() };

    const editingRow = this.editingRow();
    const request$ = editingRow
      ? this.api.call('api_key.update', [editingRow.id, { name, reset, expires_at: expiresAt }])
      : this.api.call('api_key.create', [{ name, username, expires_at: expiresAt }]);

    return {
      request$,
      // A freshly generated key is reported by the dialog below, which is a stronger
      // confirmation than a snackbar — only a save that produced no key needs one.
      successMessage: (result) => (result.key ? null : this.translate.instant('API Key Updated')),
      onSuccess: (result) => {
        if (result.key) {
          this.tnDialog.open(KeyCreatedDialog, { data: result.key });
        }
      },
    };
  };

  /** Refreshes the username options as the user types, from the first page of matches. */
  protected onUsernameSearch(query: string): void {
    this.usernameSearch$.next(query);
  }

  /** Appends the next page of matches when the open dropdown is scrolled to its end. */
  protected onUsernameLoadMore(): void {
    this.usernamesLoading.set(true);
    this.userPickerProvider.nextPage(this.lastUsernameSearch)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (options) => {
          this.usernamesLoading.set(false);
          this.usernameOptions.update((current) => [
            ...current,
            ...this.toAutocompleteOptions(options).filter(
              (option) => !current.some((existing) => existing.value === option.value),
            ),
          ]);
        },
        error: () => this.usernamesLoading.set(false),
      });
  }

  private loadUsernameOptions(): void {
    this.usernameSearch$.pipe(
      debounceTime(defaultDebounceTimeMs),
      distinctUntilChanged(),
      // Preloads the first page so the dropdown is populated before the user types. It sits after
      // `debounceTime`, so it fires immediately; routing it through the same stream lets
      // `switchMap` cancel it the moment a real search starts.
      startWith(''),
      switchMap((query) => {
        this.lastUsernameSearch = query;
        this.usernamesLoading.set(true);
        return this.userPickerProvider.fetch(query);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (options) => {
        this.usernamesLoading.set(false);
        this.usernameOptions.set(this.withSelectedUsername(this.toAutocompleteOptions(options)));
      },
      error: () => this.usernamesLoading.set(false),
    });
  }

  private toAutocompleteOptions(options: Option[]): TnAutocompleteOption<string>[] {
    return [
      { label: this.translate.instant('Add New'), value: newOption },
      ...options.map((option) => ({ label: option.label, value: String(option.value) })),
    ];
  }

  /**
   * Keeps the selected username in the list when the page just fetched doesn't contain it —
   * a preset username sorted past the first page, or one just created that the `roles != []`
   * query doesn't match yet. Without it the field would render empty for a perfectly valid value.
   */
  private withSelectedUsername(options: TnAutocompleteOption<string>[]): TnAutocompleteOption<string>[] {
    const selected = this.form.controls.username.value;
    if (!selected || selected === newOption || options.some((option) => option.value === selected)) {
      return options;
    }

    return [...options, { label: selected, value: selected }];
  }

  /**
   * Selecting "Add New" opens the user form; the created user becomes the selected username.
   * Dismissing that form without saving puts the control back to whatever was selected before —
   * `newOption` ('NEW') is not a real username, but it does satisfy `Validators.required`, so
   * leaving it in place would let the form submit it (and block a second "Add New", whose value
   * would then be unchanged).
   */
  private listenForAddNewUser(): void {
    this.form.controls.username.valueChanges.pipe(
      // The username set in `ngOnInit` predates this subscription, so seed it explicitly —
      // otherwise a cancel before any manual pick would restore an empty field.
      startWith(this.form.controls.username.value),
      distinctUntilChanged(),
      tap((value) => {
        if (value !== newOption) {
          this.previousUsername = value;
        }
      }),
      filter((value) => value === newOption),
      switchMap(() => this.formPanel.open(UserFormComponent, {
        wide: true,
        title: this.translate.instant('Add User'),
      })),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ response: newUser }) => {
      if (!newUser) {
        this.form.controls.username.setValue(this.previousUsername);
        return;
      }

      this.usernameOptions.update((current) => [
        ...current,
        { label: newUser.username, value: newUser.username },
      ]);
      this.form.controls.username.setValue(newUser.username);
    });
  }

  private setCurrentUsername(): void {
    const username = this.username();
    if (username) {
      this.form.patchValue({ username });
    }
  }

  private addForbiddenNamesValidator(): void {
    this.form.controls.name.setAsyncValidators(forbiddenAsyncValues(this.forbiddenNames$));
    this.form.controls.name.updateValueAndValidity();
  }

  private handleNonExpiringChanges(): void {
    this.form.controls.nonExpiring.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((nonExpiring) => {
      if (nonExpiring) {
        this.form.controls.expires_at.disable();
      } else {
        this.form.controls.expires_at.enable();
      }
    });
  }
}
