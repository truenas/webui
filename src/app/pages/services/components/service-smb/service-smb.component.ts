import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnAutocompleteComponent, TnCheckboxComponent, TnChipInputComponent, TnFormFieldComponent,
  TnFormListComponent, TnFormListItemComponent, TnFormSectionComponent, TnInputComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import {
  BehaviorSubject, catchError, debounceTime, distinctUntilChanged, of, shareReplay, switchMap, tap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { SmbEncryption, smbEncryptionLabels } from 'app/enums/smb-encryption.enum';
import { SmbMinProtocol, smbMinProtocolLabels } from 'app/enums/smb-min-protocol.enum';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceSmb } from 'app/helptext/services/components/service-smb';
import { SmbConfigUpdate, smbSearchSpotlight } from 'app/interfaces/smb-config.interface';
import { SmbSharePurpose } from 'app/interfaces/smb-share.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import {
  advancedModeFooterAction, advancedModeSettingLabels, SidePanelFooterAction,
} from 'app/modules/slide-ins/form-side-panel/side-panel-footer-actions';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  serviceConfigSavedMessage,
} from 'app/pages/services/components/service-config-forms.constants';
import { UserService } from 'app/services/user.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

interface BindIp {
  bindIp: string;
}

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createSmbForm(fb: FormBuilder, validatorsService: IxValidatorsService, translate: TranslateService) {
  return fb.group({
    netbiosname: ['', [Validators.required, Validators.maxLength(15)]],
    netbiosalias: [[] as string[], [
      validatorsService.customValidator(
        (control: AbstractControl<string[]>) => {
          return control.value?.every((alias: string) => alias.length <= 15);
        },
        translate.instant('Aliases must be 15 characters or less.'),
      ),
    ]],
    workgroup: ['', [Validators.required]],
    description: ['', []],
    minimum_protocol: [SmbMinProtocol.Smb2, [Validators.required]],
    ntlmv1_auth: [false, []],
    unixcharset: ['', []],
    debug: [false, []],
    syslog: [false, []],
    localmaster: [false, []],
    guest: ['nobody', []],
    filemask: ['', []],
    dirmask: ['', []],
    admin_group: ['', [Validators.maxLength(120)]],
    bindip: fb.array<BindIp>([]),
    aapl_extensions: [false, []],
    multichannel: [false, []],
    encryption: [SmbEncryption.Default],
    spotlight_search: [false, []],
    stateful_failover: [false, []],
  });
}

/**
 * The form's own value shape, which is deliberately NOT `SmbConfigUpdate`: `bindip` is a
 * FormArray of `{ bindIp }` rows and `spotlight_search` stands in for `search_protocols`
 * (both reshaped in {@link ServiceSmbComponent.handleSubmit}).
 */
type SmbFormValue = ReturnType<ReturnType<typeof createSmbForm>['getRawValue']>;

@Component({
  selector: 'ix-service-smb',
  templateUrl: './service-smb.component.html',
  styleUrls: ['./service-smb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnAutocompleteComponent,
    TnChipInputComponent,
    TnFormListComponent,
    TnFormListItemComponent,
    IxFormComponent,
    TranslateModule,
  ],
})
export class ServiceSmbComponent extends IxFormHostForm<boolean, SmbFormValue> implements OnInit {
  private api = inject(ApiService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private validatorsService = inject(IxValidatorsService);
  private truenasConnectService = inject(TruenasConnectService);
  private userService = inject(UserService);
  private existenceValidation = inject(UserGroupExistenceValidationService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);

  protected hasIncompatibleShares = signal(false);
  protected isSmb1Enabled = signal(false);
  protected readonly minimumProtocolOptions = mapToOptions(smbMinProtocolLabels, this.translate);

  protected isEnterprise = toSignal(this.store$.select(selectIsEnterprise), { initialValue: false });
  protected isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed), { initialValue: false });

  protected isTruenasConnectConfigured = computed(() => {
    const config = this.truenasConnectService.config();
    return config?.status === TruenasConnectStatus.Configured;
  });

  protected isSpotlightEnabled = computed(() => {
    return this.isEnterprise() || this.isTruenasConnectConfigured();
  });

  protected shouldShowTruenasConnectNotice = computed(() => {
    return !this.isEnterprise() && !this.isTruenasConnectConfigured();
  });

  protected isStatefulFailoverEnabled = computed(() => {
    return this.isHaLicensed() && !this.hasIncompatibleShares() && !this.isSmb1Enabled();
  });

  /**
   * Reactively enable/disable the Spotlight checkbox based on TrueNAS Connect configuration
   * and Enterprise status. On non-Enterprise systems, Spotlight requires TrueNAS Connect.
   *
   * Reactively enable/disable the Stateful Failover checkbox based on HA license,
   * incompatible shares, and SMB1 status.
   */
  constructor() {
    super();

    effect(() => {
      const isEnabled = this.isSpotlightEnabled();
      if (isEnabled) {
        this.form.controls.spotlight_search.enable();
      } else {
        this.form.controls.spotlight_search.disable();
      }
    });

    effect(() => {
      const isEnabled = this.isStatefulFailoverEnabled();
      if (isEnabled) {
        this.form.controls.stateful_failover.enable();
      } else {
        this.form.controls.stateful_failover.disable();
      }
    });
  }

  protected readonly isAdvancedMode = signal(false);

  protected readonly form = createSmbForm(this.fb, this.validatorsService, this.translate);

  readonly requiredRoles = [Role.SharingSmbWrite];

  /** The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). */
  private readonly advancedToggle = advancedModeFooterAction(this.isAdvancedMode, {
    labels: advancedModeSettingLabels,
    // Keeps the `data-test` value the in-body toggle shipped with, so integration selectors
    // targeting this form don't break on the move into the panel footer.
    testId: 'toggle-advanced-settings',
  });

  get footerActions(): SidePanelFooterAction[] {
    return this.advancedToggle();
  }

  readonly helptext = helptextServiceSmb;
  readonly tooltips = {
    netbiosname: helptextServiceSmb.netbiosnameTooltip,
    netbiosalias: helptextServiceSmb.netbiosaliasTooltip,
    workgroup: helptextServiceSmb.workgroupTooltip,
    description: helptextServiceSmb.descriptionTooltip,
    minimum_protocol: helptextServiceSmb.minimumProtocolTooltip,
    ntlmv1_auth: helptextServiceSmb.ntlmv1AuthTooltip,
    unixcharset: helptextServiceSmb.unixcharsetTooltip,
    debug: helptextServiceSmb.debugTooltip,
    syslog: helptextServiceSmb.syslogTooltip,
    localmaster: helptextServiceSmb.localmasterTooltip,
    guest: helptextServiceSmb.guestTooltip,
    filemask: helptextServiceSmb.filemaskTooltip,
    dirmask: helptextServiceSmb.dirmaskTooltip,
    admin_group: helptextServiceSmb.adminGroupTooltip,
    bindip: helptextServiceSmb.bindipTooltip,
    aapl_extensions: helptextServiceSmb.aaplExtensionsTooltip,
    multichannel: helptextServiceSmb.multichannelTooltip,
    spotlight_search: helptextServiceSmb.spotlightSearchTooltip,
    stateful_failover: helptextServiceSmb.statefulFailoverTooltip,
  };

  readonly unixCharsetOptions$ = this.api.call('smb.unixcharset_choices').pipe(choicesToOptions());

  /**
   * The addresses the saved config binds to, captured by the gated `smb.config` load. Folded into
   * the choice list below because `smb.bindip_choices` only offers addresses the system currently
   * has: one the config still binds to but that has since gone away would otherwise be missing from
   * the options and silently dropped from the select.
   */
  private readonly configuredBindIps = signal<string[]>([]);

  private readonly availableBindIps = toSignal(
    this.api.call('smb.bindip_choices').pipe(
      choicesToOptions(),
      map((options) => options.map((option) => `${option.value}`)),
      // Fails soft, like the other choice streams: `toSignal` latches an error and re-throws it on
      // every read, and this one is read from `bindIpAddressOptions()` during template evaluation —
      // so an uncaught failure would take down the whole form render instead of emptying one
      // select. The configured addresses still reach the options through `configuredBindIps`.
      catchError(() => of([] as string[])),
    ),
    { initialValue: [] as string[] },
  );

  protected readonly bindIpAddressOptions = computed(() => {
    return [...new Set([...this.configuredBindIps(), ...this.availableBindIps()])]
      .map((value) => ({ label: value, value }));
  });

  readonly encryptionOptions = mapToOptions(smbEncryptionLabels, this.translate);

  // Server-searched option streams for the Guest Account / Administrators Group
  // autocompletes. switchMap cancels in-flight queries on new input; catchError
  // keeps one failed DS query from killing the stream for the rest of the form's
  // life — the dropdown shows "Options cannot be loaded" via [noResultsText],
  // the same in-panel signal the old ix-combobox rendered.
  protected readonly usersFetchFailed = signal(false);
  protected readonly usersLoading = signal(false);
  protected readonly userSearch$ = new BehaviorSubject('');
  protected readonly userOptions$ = this.userSearch$.pipe(
    debounceTime(defaultDebounceTimeMs),
    distinctUntilChanged(),
    tap(() => this.usersLoading.set(true)),
    switchMap((query) => this.userService.userQueryDsCache(query).pipe(
      tap(() => this.usersFetchFailed.set(false)),
      catchError((error: unknown) => {
        console.error('User autocomplete fetch failed:', error);
        this.usersFetchFailed.set(true);
        return of([]);
      }),
    )),
    map((users) => users.map((user) => ({ label: user.username, value: user.username }))),
    tap(() => this.usersLoading.set(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly groupsFetchFailed = signal(false);
  protected readonly groupsLoading = signal(false);
  protected readonly groupSearch$ = new BehaviorSubject('');
  protected readonly groupOptions$ = this.groupSearch$.pipe(
    debounceTime(defaultDebounceTimeMs),
    distinctUntilChanged(),
    tap(() => this.groupsLoading.set(true)),
    switchMap((query) => this.userService.groupQueryDsCache(query).pipe(
      tap(() => this.groupsFetchFailed.set(false)),
      catchError((error: unknown) => {
        console.error('Group autocomplete fetch failed:', error);
        this.groupsFetchFailed.set(true);
        return of([]);
      }),
    )),
    map((groups) => groups.map((group) => ({ label: group.group, value: group.group }))),
    tap(() => this.groupsLoading.set(false)),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  ngOnInit(): void {
    // Parity with the former ix-user/group-combobox controls: custom-typed values
    // must exist on the system (empty values pass).
    this.form.controls.guest.addAsyncValidators(this.existenceValidation.validateUserExists());
    this.form.controls.admin_group.addAsyncValidators(this.existenceValidation.validateGroupExists());

    this.form.controls.minimum_protocol.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.isSmb1Enabled.set(value === SmbMinProtocol.Smb1));

    this.api.call('sharing.smb.query').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (shares) => {
        const incompatiblePurposes = [SmbSharePurpose.MultiProtocolShare, SmbSharePurpose.LegacyShare];
        const hasIncompatible = shares.some((share) => incompatiblePurposes.includes(share.purpose));
        this.hasIncompatibleShares.set(hasIncompatible);
      },
    });

    this.loadFormConfig(this.api.call('smb.config'), (config) => {
      const searchProtocolEnabled = config.search_protocols.includes(smbSearchSpotlight);
      // The rows are pushed, not patched, so the patch has to start from an empty array to stay
      // idempotent — `loadFormConfig` replays it on retry, and without this every bind IP would
      // come back duplicated.
      this.form.controls.bindip.clear();
      config.bindip.forEach(() => this.addBindIp());
      this.configuredBindIps.set(config.bindip);
      this.form.patchValue({
        ...config,
        spotlight_search: searchProtocolEnabled,
        bindip: config.bindip.map((ip) => ({ bindIp: ip })),
      });
      this.isSmb1Enabled.set(config.minimum_protocol === SmbMinProtocol.Smb1);
    });
  }

  addBindIp(): void {
    this.form.controls.bindip.push(this.fb.group({
      bindIp: ['', [Validators.required]],
    }));
  }

  removeBindIp(index: number): void {
    this.form.controls.bindip.removeAt(index);
  }

  protected openTruenasConnectModal(): void {
    this.truenasConnectService.openStatusModal();
  }

  protected onTruenasConnectLinkKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault(); // Prevents page scroll on Space
    this.openTruenasConnectModal();
  }

  // Built from `allValues`, not `changedValues`, so the disabled controls — `spotlight_search` /
  // `stateful_failover` — still reach the API.
  protected handleSubmit = ({ allValues }: FormSubmitEvent<SmbFormValue>): SubmitResult => {
    const { spotlight_search: spotlightSearch, bindip, ...formValues } = allValues;
    const values: SmbConfigUpdate = {
      ...formValues,
      search_protocols: spotlightSearch ? [smbSearchSpotlight] : [],
      bindip: bindip.map((value) => value.bindIp),
    };

    return {
      request$: this.api.call('smb.update', [values]),
      successMessage: this.translate.instant(serviceConfigSavedMessage),
    };
  };
}
