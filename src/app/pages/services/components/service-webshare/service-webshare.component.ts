import {
  ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef, computed, effect,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey, webSharePasskeyLabels } from 'app/enums/webshare-passkey.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceWebshare } from 'app/helptext/services/components/service-webshare';
import { WebShareConfig, WebShareConfigUpdate } from 'app/interfaces/webshare-config.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-service-webshare',
  templateUrl: './service-webshare.component.html',
  styleUrls: ['./service-webshare.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TranslateModule,
  ],
})
export class ServiceWebshareComponent extends IxFormHostForm implements OnInit {
  readonly requiredRoles = [Role.SharingWebshareWrite, Role.SharingWrite];

  private api = inject(ApiService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private truenasConnectService = inject(TruenasConnectService);

  protected readonly dataLoading = signal(false);
  protected readonly initialFormSnapshot = signal<Partial<WebShareConfigUpdate> | null>(null);

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
    this.dataLoading.set(true);
    this.api.call('webshare.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config: WebShareConfig) => {
        this.form.patchValue({
          // `webshare.config` is async, so it can resolve after the guard effect has already
          // locked the control off. Gate the loaded value too, otherwise a stale `search: true`
          // from the backend would be restored while Connect is disabled and then submitted.
          search: config.search && this.isTruenasConnectConfigured(),
          passkey: config.passkey,
        });
        this.initialFormSnapshot.set(this.form.getRawValue());
        this.dataLoading.set(false);
      },
      error: (error: unknown) => {
        this.dataLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  protected handleSubmit = (event: FormSubmitEvent<WebShareConfigUpdate>): SubmitResult => ({
    request$: this.api.call('webshare.update', [event.allValues]),
    successMessage: this.translate.instant('Service configuration saved'),
    closeWith: () => true,
  });
}
