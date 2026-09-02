import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, input, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnDateInputComponent, TnDialog, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnUserAutocompleteComponent,
} from '@truenas/ui-components';
import { filter, map } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { helptextApiKeys } from 'app/helptext/api-keys';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  KeyCreatedDialog,
} from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { TrueNasDirectoryOptions } from 'app/services/truenas-user-directory.service';

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
    TnUserAutocompleteComponent,
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
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
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

  /**
   * Narrows the field to users that have a role, and is also what its "Add New"
   * row creates against. The field is only rendered for a full admin, so no
   * query can be issued for a user who could never see the result.
   */
  protected readonly userDirectoryOptions: TrueNasDirectoryOptions = {
    queryParams: this.userQueryParams,
  };

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
