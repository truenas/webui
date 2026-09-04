import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef, computed, effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey, webSharePasskeyLabels } from 'app/enums/webshare-passkey.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceWebshare } from 'app/helptext/services/components/service-webshare';
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { EntitlementsService } from 'app/services/entitlements.service';

@Component({
  selector: 'ix-service-webshare',
  templateUrl: './service-webshare.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxCheckboxComponent,
    IxSelectComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class ServiceWebshareComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingWebshareWrite, Role.SharingWrite];

  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private truenasConnectService = inject(TruenasConnectService);
  private entitlements = inject(EntitlementsService);
  slideInRef = inject(SlideInRef<undefined, boolean>);

  protected isFormLoading = signal(false);

  form = this.fb.group({
    search: [false],
    passkey: [WebSharePasskey.Disabled, Validators.required],
  });

  readonly helptext = helptextServiceWebshare;
  readonly passkeyOptions$ = of(mapToOptions(webSharePasskeyLabels, this.translate));

  /**
   * TrueSearch depends on TrueNAS Connect, so it can only be enabled while Connect is
   * configured. Backed by the shared `tn_connect.config` signal, this reacts immediately
   * when Connect is disabled without requiring a page refresh.
   */
  protected readonly isTruenasConnectConfigured = computed(
    () => this.truenasConnectService.config()?.status === TruenasConnectStatus.Configured,
  );

  /**
   * A Connect connection is not a substitute for the entitlement: the two are separate
   * conditions and TrueSearch needs both. Reads `undefined` until entitlements load, which
   * leaves the control locked rather than briefly offering a feature that may be denied.
   */
  protected readonly isTrueSearchEntitled = this.entitlements.entitled(EntitlementFeature.TrueSearch);

  protected readonly canUseTrueSearch = computed(
    () => Boolean(this.isTrueSearchEntitled()) && this.isTruenasConnectConfigured(),
  );

  /**
   * Names the condition that is actually missing. Checked against `false` rather than
   * falsiness so the licensing hint is not shown while entitlements are still loading.
   */
  protected readonly trueSearchHint = computed(() => {
    if (this.isTrueSearchEntitled() === false) {
      return T('TrueSearch is not included in this system\'s license.');
    }
    if (!this.isTruenasConnectConfigured()) {
      return T('TrueSearch requires TrueNAS Connect to be configured.');
    }
    return '';
  });

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    // Keep the TrueSearch control enabled only while it is both entitled and Connect is
    // configured. Otherwise we force the toggle off and lock it so it can neither be enabled
    // in the UI nor submitted as `true`.
    effect(() => {
      const searchControl = this.form.controls.search;
      if (this.canUseTrueSearch()) {
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
          // from the backend would be restored while unavailable and then submitted.
          search: config.search && this.canUseTrueSearch(),
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
        this.slideInRef.close({ response: true, error: null });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
