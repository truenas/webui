import { AsyncPipe } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, signal, inject, computed, effect, DestroyRef } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { FormBuilder } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnAutocompleteComponent, TnCheckboxComponent, TnChipInputComponent, TnFormFieldComponent,
  TnFormSectionComponent, TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  BehaviorSubject, catchError, combineLatest, debounceTime, distinctUntilChanged, of, shareReplay, switchMap, tap,
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
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { defaultDebounceTimeMs } from 'app/modules/forms/ix-forms/ix-forms.constants';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { UserGroupExistenceValidationService } from 'app/modules/forms/ix-forms/validators/user-group-existence-validation.service';
import { SidePanelFooterAction } from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UserService } from 'app/services/user.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

interface BindIp {
  bindIp: string;
}

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
    IxListComponent,
    IxListItemComponent,
    IxFormComponent,
    TranslateModule,
  ],
})
export class ServiceSmbComponent extends IxFormHostForm implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private fb = inject(FormBuilder);
  private translate = inject(TranslateService);
  private validatorsService = inject(IxValidatorsService);
  private truenasConnectService = inject(TruenasConnectService);
  private userService = inject(UserService);
  private existenceValidation = inject(UserGroupExistenceValidationService);
  private store$ = inject(Store);
  private destroyRef = inject(DestroyRef);

  protected readonly dataLoading = signal(false);
  protected readonly initialFormSnapshot = signal<Partial<SmbConfigUpdate> | null>(null);
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

  protected readonly isBasicMode = signal(true);

  protected readonly form = this.fb.group({
    netbiosname: ['', [Validators.required, Validators.maxLength(15)]],
    netbiosalias: [[] as string[], [
      this.validatorsService.customValidator(
        (control: AbstractControl<string[]>) => {
          return control.value?.every((alias: string) => alias.length <= 15);
        },
        this.translate.instant('Aliases must be 15 characters or less.'),
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
    bindip: this.fb.array<BindIp>([]),
    aapl_extensions: [false, []],
    multichannel: [false, []],
    encryption: [SmbEncryption.Default],
    spotlight_search: [false, []],
    stateful_failover: [false, []],
  });

  readonly requiredRoles = [Role.SharingSmbWrite];

  /**
   * The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). Re-read each
   * change detection, so the label flips with {@link isBasicMode}.
   */
  get footerActions(): SidePanelFooterAction[] {
    // Labels are extraction markers — the panel container pipes them through `translate`.
    return [{
      label: this.isBasicMode() ? T('Advanced Settings') : T('Basic Settings'),
      testId: 'toggle-advanced-settings',
      onClick: () => this.onAdvancedSettingsToggled(),
    }];
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

  readonly bindIpAddressOptions$ = combineLatest([
    this.api.call('smb.bindip_choices').pipe(choicesToOptions()),
    this.api.call('smb.config'),
  ]).pipe(
    map(([options, config]) => {
      return [
        ...new Set<string>([
          ...config.bindip,
          ...options.map((option) => `${option.value}`),
        ]),
      ].map((value) => ({ label: value, value }));
    }),
  );

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
    this.dataLoading.set(true);

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

    this.api.call('smb.config').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (config) => {
        const searchProtocolEnabled = config.search_protocols.includes(smbSearchSpotlight);
        config.bindip.forEach(() => this.addBindIp());
        this.form.patchValue({
          ...config,
          spotlight_search: searchProtocolEnabled,
          bindip: config.bindip.map((ip) => ({ bindIp: ip })),
        });
        this.isSmb1Enabled.set(config.minimum_protocol === SmbMinProtocol.Smb1);
        this.initialFormSnapshot.set(this.form.getRawValue() as unknown as Partial<SmbConfigUpdate>);
        this.dataLoading.set(false);
      },
      error: (error: unknown) => {
        this.dataLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
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

  onAdvancedSettingsToggled(): void {
    this.isBasicMode.update((isBasic) => !isBasic);
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

  protected handleSubmit = (): SubmitResult => {
    const { spotlight_search: spotlightSearch, ...formValues } = this.form.getRawValue();
    const values: SmbConfigUpdate = {
      ...formValues,
      search_protocols: spotlightSearch ? [smbSearchSpotlight] : [],
      bindip: this.form.getRawValue().bindip.map((value) => value.bindIp),
    };

    return {
      request$: this.api.call('smb.update', [values]),
      successMessage: this.translate.instant('Service configuration saved'),
      closeWith: () => true,
    };
  };
}
