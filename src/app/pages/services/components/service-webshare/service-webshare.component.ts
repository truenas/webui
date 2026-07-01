import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef, computed, effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey, webSharePasskeyLabels } from 'app/enums/webshare-passkey.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceWebshare } from 'app/helptext/services/components/service-webshare';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-service-webshare',
  templateUrl: './service-webshare.component.html',
  styleUrls: ['./service-webshare.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class ServiceWebshareComponent extends SidePanelForm implements OnInit {
  readonly requiredRoles = [Role.SharingWebshareWrite, Role.SharingWrite];

  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private truenasConnectService = inject(TruenasConnectService);

  readonly isFormLoading = signal(false);

  protected readonly form = this.fb.group({
    search: [false],
    passkey: [WebSharePasskey.Disabled, Validators.required],
  });

  readonly helptext = helptextServiceWebshare;
  readonly passkeyOptions = mapToOptions(webSharePasskeyLabels, this.translate);

  /**
   * TrueSearch depends on TrueNAS Connect, so it can only be enabled while Connect is
   * configured. Backed by the shared `tn_connect.config` signal, this reacts immediately
   * when Connect is disabled without requiring a page refresh.
   */
  protected readonly isTruenasConnectConfigured = computed(
    () => this.truenasConnectService.config()?.status === TruenasConnectStatus.Configured,
  );

  /** Public signal hosts can read to disable a Save action while invalid or loading. */
  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  constructor() {
    super();
    // Keep the TrueSearch control enabled only while TrueNAS Connect is configured. When
    // Connect is disabled we force the toggle off and lock it so it can neither be enabled
    // in the UI nor submitted as `true`.
    effect(() => {
      const searchControl = this.form.controls.search;
      if (this.isTruenasConnectConfigured()) {
        searchControl.enable({ emitEvent: false });
      } else {
        searchControl.setValue(false, { emitEvent: false });
        searchControl.disable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.api.call('webshare.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config: WebShareConfig) => {
        this.form.patchValue({
          // `webshare.config` is async, so it can resolve after the guard effect has already
          // locked the control off. Gate the loaded value too, otherwise a stale `search: true`
          // from the backend would be restored while Connect is disabled and then submitted.
          search: config.search && this.isTruenasConnectConfigured(),
          passkey: config.passkey,
        });
        this.isFormLoading.set(false);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  onSubmit(): void {
    const values = this.form.getRawValue();

    this.isFormLoading.set(true);
    this.api.call('webshare.update', [values]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Service configuration saved'));
        this.close(true);
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
