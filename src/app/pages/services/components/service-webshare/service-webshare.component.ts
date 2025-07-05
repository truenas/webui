import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject,
} from '@angular/core';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators, FormGroup } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceWebshare } from 'app/helptext/services/components/service-webshare';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { ChipsProvider } from 'app/modules/forms/ix-forms/components/ix-chips/chips-provider';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { UserService } from 'app/services/user.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-webshare',
  templateUrl: './service-webshare.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxIconComponent,
    IxInputComponent,
    IxListComponent,
    IxListItemComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    MatIconButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ServiceWebshareComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWrite];

  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private userService = inject(UserService);
  slideInRef = inject(SlideInRef<undefined, boolean>);

  protected isFormLoading = signal(false);

  groupProvider: ChipsProvider = (query) => {
    return this.userService.groupQueryDsCache(query).pipe(
      map((groups) => groups.map((group) => group.group)),
    );
  };

  form = this.fb.group({
    storage_admins: [false],
    search_index_pool: [null as string | null],
    bulk_download_pool: [null as string | null],
    enable_web_terminal: [false],
    allowed_groups: [[] as string[]],
    proxy_port: [755, [Validators.required, Validators.min(1), Validators.max(65535)]],
    proxy_bind_addrs: this.fb.array<FormGroup>([]),
    passkey_mode: ['disabled' as 'disabled' | 'enabled' | 'required'],
    passkey_rp_origins: [[] as string[]],
    remove_passkey_username: [''],
  });

  readonly helptext = helptextServiceWebshare;

  get canRemovePasskey(): boolean {
    return !!(this.form.value.remove_passkey_username?.trim());
  }

  readonly passkeyModeOptions$ = of([
    { label: this.translate.instant('Disabled'), value: 'disabled' },
    { label: this.translate.instant('Enabled'), value: 'enabled' },
    { label: this.translate.instant('Required'), value: 'required' },
  ]);

  readonly poolOptions$ = this.api.call('pool.query').pipe(
    map((pools) => pools.map((pool) => ({
      label: pool.name,
      value: pool.name,
    }))),
  );

  readonly bindAddressOptions$ = combineLatest([
    this.api.call('smb.bindip_choices').pipe(choicesToOptions()),
    this.api.call('webshare.config'),
  ]).pipe(
    map(([options, config]) => {
      return [
        ...new Set<string>([
          ...config.proxy_bind_addrs,
          ...options.map((option) => `${option.value}`),
        ]),
      ].map((value) => ({ label: value, value }));
    }),
  );


  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.api.call('webshare.config').pipe(untilDestroyed(this)).subscribe({
      next: (config: WebShareConfig) => {
        // Add form controls for existing bind addresses
        config.proxy_bind_addrs.forEach(() => this.addBindAddress());

        this.form.patchValue({
          storage_admins: config.storage_admins,
          search_index_pool: config.search_index_pool,
          bulk_download_pool: config.bulk_download_pool,
          enable_web_terminal: config.enable_web_terminal,
          allowed_groups: config.allowed_groups || ['webshare'],
          proxy_port: config.proxy_port,
          proxy_bind_addrs: config.proxy_bind_addrs.map((addr) => ({ bindAddr: addr })),
          passkey_mode: config.passkey_mode || 'disabled',
          passkey_rp_origins: config.passkey_rp_origins || [],
        });
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  addBindAddress(): void {
    this.form.controls.proxy_bind_addrs.push(this.fb.group({
      bindAddr: ['', [Validators.required]],
    }));
  }

  removeBindAddress(index: number): void {
    this.form.controls.proxy_bind_addrs.removeAt(index);
  }

  removeUserPasskey(): void {
    const username = this.form.value.remove_passkey_username?.trim();
    if (!username) {
      return;
    }

    this.api.call('webshare.remove_passkey', [username]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (result: { username: string; success: boolean; message: string; output: string }) => {
        this.snackbar.success(
          this.translate.instant('Passkey removed successfully for user: {username}', { username: result.username }),
        );
        // Clear the username input after successful removal
        this.form.patchValue({ remove_passkey_username: '' });
      },
      error: (error: unknown) => {
        this.dialog.error({
          title: this.translate.instant('Error'),
          message: (error as Error)?.message || this.translate.instant('Failed to remove passkey'),
        });
      },
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    // Always enable search when saving
    const payload = {
      ...values,
      search_enabled: true,
      search_pruning_enabled: true,
      proxy_bind_addrs: this.form.value.proxy_bind_addrs?.map((value) => value.bindAddr) || [],
      passkey_mode: values.passkey_mode || 'disabled',
      passkey_rp_origins: values.passkey_rp_origins || [],
    };

    this.isFormLoading.set(true);
    this.api.call('webshare.update', [payload]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Service configuration saved'));
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
