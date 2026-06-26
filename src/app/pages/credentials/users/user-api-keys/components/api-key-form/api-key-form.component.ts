import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, input, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnDateInputComponent, TnDialog, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { filter, map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { helptextApiKeys } from 'app/helptext/api-keys';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { UserPickerProvider } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker-provider';
import { IxUserPickerComponent } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  KeyCreatedDialog,
} from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';

@Component({
  selector: 'ix-api-key-form',
  templateUrl: './api-key-form.component.html',
  styleUrls: ['./api-key-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnDateInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxUserPickerComponent,
  ],
})
export class ApiKeyFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private tnDialog = inject(TnDialog);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private errorHandler = inject(FormErrorHandlerService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  /** API key being edited; absent when adding. Supplied by the `<tn-side-panel>` host. */
  readonly editingKey = input<ApiKey | undefined>(undefined);
  /** Pre-selected username (e.g. opened from a user's access card). */
  readonly presetUsername = input<string | undefined>(undefined);

  protected readonly minDateToday = new Date();
  protected readonly editingRow = signal<ApiKey | undefined>(undefined);
  protected readonly isNew = computed(() => !this.editingRow());
  protected readonly isLoading = signal(false);
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

  protected readonly forbiddenNames$ = this.api.call('api_key.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(map((keys) => keys.map((key) => key.name)));

  /** Drives the host-owned Save action (`<tn-side-panel>` footer). */
  readonly canSubmit = this.trackCanSubmit(this.isLoading);

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
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
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

    request$
      .pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ key }) => {
          this.isLoading.set(false);
          this.close(true);

          if (key) {
            this.tnDialog.open(KeyCreatedDialog, { data: key });
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
          this.loader.close();
        },
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
