import {
  ChangeDetectionStrategy, Component, computed, OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { helptextApiKeys } from 'app/helptext/api-keys';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxDatepickerComponent } from 'app/modules/forms/ix-forms/components/ix-date-picker/ix-date-picker.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { UserPickerProvider } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker-provider';
import { IxUserPickerComponent } from 'app/modules/forms/ix-forms/components/ix-user-picker/ix-user-picker.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  KeyCreatedDialog,
} from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';

export interface ApiKeyParams {
  /**
   * Username of the user for whom the API key is being created or edited.
   */
  username?: string;

  /**
   * Whether the form is being used to edit an existing API key.
   */
  editingKey?: ApiKey;
}

@UntilDestroy()
@Component({
  selector: 'ix-api-key-form',
  templateUrl: './api-key-form.component.html',
  styleUrls: ['./api-key-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormActionsComponent,
    IxCheckboxComponent,
    IxDatepickerComponent,
    IxFieldsetComponent,
    IxInputComponent,
    MatButton,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    ReactiveFormsModule,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    IxUserPickerComponent,
  ],
})
export class ApiKeyFormComponent implements OnInit {
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
    .filter('local', '=', false)
    .orFilter('roles', '!=', [])
    .setOptions({ select: ['username'], order_by: ['username'] })
    .getParams();

  protected readonly usernames$ = this.api.call('user.query', this.userQueryParams).pipe(
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
  );

  protected readonly userPickerProvider = new UserPickerProvider({
    queryParams: this.userQueryParams,
  });

  protected readonly forbiddenNames$ = this.api.call('api_key.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(map((keys) => keys.map((key) => key.name)));

  constructor(
    private fb: NonNullableFormBuilder,
    private matDialog: MatDialog,
    private api: ApiService,
    private loader: LoaderService,
    private errorHandler: FormErrorHandlerService,
    private authService: AuthService,
    public slideInRef: SlideInRef<ApiKeyParams | undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    const data = this.slideInRef.getData();
    const { editingKey, username } = data || {};

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

      if (username) {
        this.form.patchValue({ username });
      } else {
        this.setCurrentUsername();
      }
    }
    this.handleNonExpiringChanges();
  }

  onSubmit(): void {
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
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: ({ key }) => {
          this.isLoading.set(false);
          this.slideInRef.close({ response: true });

          if (key) {
            this.matDialog.open(KeyCreatedDialog, { data: key });
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
          this.loader.close();
        },
      });
  }

  protected setCurrentUsername(): void {
    const username = this.username();
    if (username) {
      this.form.patchValue({ username });
    }
  }

  protected addForbiddenNamesValidator(): void {
    this.form.controls.name.setAsyncValidators(forbiddenAsyncValues(this.forbiddenNames$));
    this.form.controls.name.updateValueAndValidity();
  }

  private handleNonExpiringChanges(): void {
    this.form.controls.nonExpiring.valueChanges.pipe(untilDestroyed(this)).subscribe((nonExpiring) => {
      if (nonExpiring) {
        this.form.controls.expires_at.disable();
      } else {
        this.form.controls.expires_at.enable();
      }
    });
  }
}
