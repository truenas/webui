import {
  ChangeDetectionStrategy, Component, computed, inject, OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { ParamsBuilder } from 'app/helpers/params-builder/params-builder.class';
import { helptextApiKeys } from 'app/helptext/api-keys';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { User } from 'app/interfaces/user.interface';
import { SimpleAsyncComboboxProvider } from 'app/modules/forms/ix-forms/classes/simple-async-combobox-provider';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { forbiddenAsyncValues } from 'app/modules/forms/ix-forms/validators/forbidden-values-validation/forbidden-values-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { KeyCreatedDialogComponent } from 'app/pages/credentials/users/user-api-keys/components/key-created-dialog/key-created-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-api-key-form',
  templateUrl: './api-key-form-dialog.component.html',
  styleUrls: ['./api-key-form-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxComboboxComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    IxFieldsetComponent,
  ],
})
export class ApiKeyFormComponent implements OnInit {
  protected readonly isNew = computed(() => !this.editingRow());
  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.ApiKeyWrite, Role.SharingAdmin, Role.ReadonlyAdmin];
  protected readonly isFullAdmin = toSignal(this.authService.hasRole([Role.FullAdmin]));
  protected readonly currentUsername$ = this.authService.user$.pipe(map((user) => user.pw_name));
  protected readonly username = toSignal(this.currentUsername$);
  protected readonly tooltips = {
    name: helptextApiKeys.name.tooltip,
    username: helptextApiKeys.username.tooltip,
    reset: helptextApiKeys.reset.tooltip,
  };

  protected readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    username: ['', [Validators.required]],
    reset: [false],
  });

  protected readonly userQueryParams = new ParamsBuilder<User>()
    .filter('local', '=', false)
    .orFilter('roles', '!=', [])
    .setOptions({ select: ['username'], order_by: ['username'] })
    .getParams();

  protected readonly usernames$ = this.ws.call('user.query', this.userQueryParams).pipe(
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
  );

  protected readonly userProvider = new SimpleAsyncComboboxProvider(this.usernames$);

  protected readonly forbiddenNames$ = this.ws.call('api_key.query', [
    [], { select: ['name'], order_by: ['name'] },
  ]).pipe(map((keys) => keys.map((key) => key.name)));

  private readonly editingRow = signal(inject<ApiKey>(SLIDE_IN_DATA));

  constructor(
    private fb: FormBuilder,
    private slideInRef: SlideInRef<ApiKeyFormComponent>,
    private matDialog: MatDialog,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: FormErrorHandlerService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.addForbiddenNamesValidator();
    this.setCurrentUsername();

    if (!this.isNew()) {
      this.form.patchValue(this.editingRow());
    }
  }

  onSubmit(): void {
    this.isLoading.set(true);
    const { name, username, reset } = this.form.value;
    const request$ = this.isNew()
      ? this.ws.call('api_key.create', [{ name, username }])
      : this.ws.call('api_key.update', [this.editingRow().id, { name, reset }]);

    request$
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: ({ key }) => {
          this.isLoading.set(false);
          this.slideInRef.close(true);

          if (key) {
            this.matDialog.open(KeyCreatedDialogComponent, { data: key });
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.handleWsFormError(error, this.form);
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
}
