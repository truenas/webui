import {
  ChangeDetectionStrategy, Component, OnInit, inject, computed, effect,
} from '@angular/core';
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
import { WebShareConfig } from 'app/interfaces/webshare-config.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  serviceConfigSavedMessage,
} from 'app/pages/services/components/service-config-forms.constants';

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createWebshareForm(fb: NonNullableFormBuilder) {
  return fb.group({
    search: [false],
    passkey: [WebSharePasskey.Disabled, Validators.required],
  });
}

/** The form's own value shape rather than `WebShareConfigUpdate`, which `search` can drift from. */
type WebShareFormValue = ReturnType<ReturnType<typeof createWebshareForm>['getRawValue']>;

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
export class ServiceWebshareComponent extends IxFormHostForm<boolean, WebShareFormValue> implements OnInit {
  readonly requiredRoles = [Role.SharingWebshareWrite, Role.SharingWrite];

  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private truenasConnectService = inject(TruenasConnectService);

  protected readonly form = createWebshareForm(this.fb);

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

  protected readonly optionTestIdByLabel = optionTestIdByLabel;

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
    this.loadFormConfig(this.api.call('webshare.config'), (config: WebShareConfig) => {
      this.form.patchValue({
        // `webshare.config` is async, so it can resolve after the guard effect has already
        // locked the control off. Gate the loaded value too, otherwise a stale `search: true`
        // from the backend would be restored while Connect is disabled and then submitted.
        search: config.search && this.isTruenasConnectConfigured(),
        passkey: config.passkey,
      });
    });
  }

  // `allValues` is the wrapper's own getRawValue() snapshot, so the `search` control still reaches
  // the API (as false) while it is disabled by the TrueNAS Connect guard.
  protected handleSubmit = ({ allValues }: FormSubmitEvent<WebShareFormValue>): SubmitResult => ({
    request$: this.api.call('webshare.update', [allValues]),
    successMessage: this.translate.instant(serviceConfigSavedMessage),
  });
}
