import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, computed, effect, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, NonNullableFormBuilder, Validators } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnSelectComponent, TnSelectOption,
} from '@truenas/ui-components';
import { combineLatest, take } from 'rxjs';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { WebSharePasskey, webSharePasskeyLabels } from 'app/enums/webshare-passkey.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceWebshare } from 'app/helptext/services/components/service-webshare';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  serviceConfigSavedMessage,
} from 'app/pages/services/components/service-config-forms.constants';
import { EntitlementsService } from 'app/services/entitlements.service';

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createWebshareForm(fb: NonNullableFormBuilder) {
  return fb.group({
    search: [false],
    passkey: [WebSharePasskey.Disabled, Validators.required],
    mcp_enabled: [false],
    mcp_allowed_groups: [{ value: [] as string[], disabled: true }, Validators.required],
    mcp_allow_write: [{ value: false, disabled: true }],
  });
}

/** Grants Webshare access on its own, so it is always a valid MCP group. */
const webshareGroup = 'truenas_webshare';

/** The form's own value shape rather than the `webshare.update` payload, which `search` can drift from. */
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
  private entitlements = inject(EntitlementsService);
  private destroyRef = inject(DestroyRef);

  protected readonly form = createWebshareForm(this.fb);

  readonly helptext = helptextServiceWebshare;
  readonly passkeyOptions = mapToOptions(webSharePasskeyLabels, this.translate);

  /**
   * Middleware only accepts MCP groups that also grant Webshare access: `truenas_webshare` or one of
   * the Directory Service login `groups`. Those are fixed while this form is open, so only valid
   * choices are offered. Saved MCP groups are kept as options too, so they still display.
   */
  protected readonly mcpGroupOptions = signal<TnSelectOption<string>[]>(this.toGroupOptions([webshareGroup]));

  protected readonly isMcpEnabled = signal(false);

  /**
   * With no Directory Service login groups, `truenas_webshare` is the only valid MCP group, so the
   * picker would offer a single choice. It is hidden then, and enabling MCP prefills that group.
   */
  protected readonly hasMcpGroupChoice = computed(() => this.mcpGroupOptions().length > 1);

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
   * conditions and WebShare search needs both, because WebShare itself runs through Connect.
   * (SMB Spotlight, by contrast, needs only the entitlement — see service-smb.) Reads
   * `undefined` until entitlements load, which
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
    super();
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

    // The MCP settings stay in the payload while MCP is off, so saving does not wipe them; disabling
    // them only keeps the required group list from blocking a save that does not enable MCP.
    this.form.controls.mcp_enabled.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((isEnabled) => this.onMcpEnabledChanged(isEnabled));
  }

  ngOnInit(): void {
    // Waits for a real entitlement answer, as service-smb does: `webshare.config` can resolve
    // before entitlements do, and `loadFormConfig` patches only once, so a server-enabled
    // TrueSearch would otherwise be patched off and submitted as `false` on the next save.
    this.loadFormConfig(combineLatest([
      this.api.call('webshare.config'),
      this.entitlements.entitled$(EntitlementFeature.TrueSearch).pipe(take(1)),
    ]), ([config, isEntitled]) => {
      this.form.patchValue({
        // The guard effect may already have locked the control off. Gate the loaded value too,
        // otherwise a stale `search: true` would be restored while unavailable and then submitted.
        search: config.search && isEntitled && this.isTruenasConnectConfigured(),
        // `webshare.config` spells it as the wire literal; the control holds the UI's enum of the same values.
        passkey: config.passkey as WebSharePasskey,
      });

      this.mcpGroupOptions.set(this.toGroupOptions([webshareGroup, ...config.groups, ...config.mcp_allowed_groups]));
      // Groups and write access first, so enabling MCP below does not prefill over saved groups.
      this.form.patchValue({
        mcp_allowed_groups: config.mcp_allowed_groups,
        mcp_allow_write: config.mcp_allow_write,
      });
      this.form.controls.mcp_enabled.setValue(config.mcp_enabled);
    });
  }

  // `allValues` is the wrapper's own getRawValue() snapshot, so the `search` control still reaches
  // the API (as false) while it is disabled by the TrueNAS Connect guard.
  protected handleSubmit = ({ allValues }: FormSubmitEvent<WebShareFormValue>): SubmitResult => ({
    request$: this.api.call('webshare.update', [allValues]),
    successMessage: this.translate.instant(serviceConfigSavedMessage),
  });

  private onMcpEnabledChanged(isEnabled: boolean): void {
    this.isMcpEnabled.set(isEnabled);
    const { mcp_allowed_groups: groupsControl, mcp_allow_write: allowWriteControl } = this.form.controls;
    if (!isEnabled) {
      groupsControl.disable();
      allowWriteControl.disable();
      return;
    }

    groupsControl.enable();
    allowWriteControl.enable();
    if (!groupsControl.value.length) {
      groupsControl.setValue([webshareGroup]);
    }
  }

  private toGroupOptions(groups: string[]): TnSelectOption<string>[] {
    return [...new Set(groups)].map((group) => ({ label: group, value: group }));
  }
}
