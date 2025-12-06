import { ChangeDetectionStrategy, Component, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardActions } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, forkJoin, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { IpmiChassisIdentifyState, IpmiIpAddressSource } from 'app/enums/ipmi.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { Role } from 'app/enums/role.enum';
import { helptextIpmi } from 'app/helptext/network/ipmi/ipmi';
import { Ipmi, IpmiQueryParams, IpmiUpdate } from 'app/interfaces/ipmi.interface';
import { RadioOption } from 'app/interfaces/option.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-ipmi-form',
  templateUrl: './ipmi-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxRadioGroupComponent,
    MatDivider,
    IxCheckboxComponent,
    IxInputComponent,
    MatCardActions,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    IxIconComponent,
    TranslateModule,
  ],
})
export class IpmiFormComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private redirect = inject(RedirectService);
  private fb = inject(FormBuilder);
  private validatorsService = inject(IxValidatorsService);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private systemGeneralService = inject(SystemGeneralService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<number, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.IpmiWrite];

  remoteControllerData: Ipmi;
  defaultControllerData: Ipmi;
  isManageButtonDisabled = false;
  remoteControllerOptions: Observable<RadioOption[]>;
  managementIp: string;

  protected isLoading = signal(false);
  protected isFlashing = signal(false);

  queryParams: IpmiQueryParams;
  protected ipmiId: number;

  readonly helptext = helptextIpmi;

  form = this.fb.group({
    apply_remote: new FormControl(false),
    dhcp: [false],
    ipaddress: ['', ipv4Validator()],
    gateway: ['', ipv4Validator()],
    netmask: ['', ipv4Validator()],
    vlan_id_enable: [false],
    vlan_id: [null as number | null],
    password: ['', [
      this.validatorsService.withMessage(
        Validators.maxLength(20),
        this.translate.instant(helptextIpmi.passwordLengthError),
      ),
    ]],
  });

  vlanEnabled = toSignal(this.form.controls.vlan_id_enable.valueChanges);

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.ipmiId = this.slideInRef.getData();
  }

  ngOnInit(): void {
    this.setFormRelations();
    this.loadFormData();

    if (this.ipmiId) {
      this.setIdIpmi();
    }
  }

  private setIdIpmi(): void {
    this.queryParams = [{
      'query-filters': [['id', '=', this.ipmiId]],
    }];
  }

  toggleFlashing(): void {
    this.api.call('ipmi.chassis.identify', [this.isFlashing() ? OnOff.Off : OnOff.On])
      .pipe(this.errorHandler.withErrorHandler(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(
          this.isFlashing()
            ? this.translate.instant('Identify light is now off.')
            : this.translate.instant('Identify light is now flashing.'),
        );
        this.isFlashing.set(!this.isFlashing());
      });
  }

  openManageWindow(): void {
    this.redirect.openWindow(`https://${this.managementIp}`);
  }

  private loadFormData(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.call('ipmi.lan.query', this.queryParams),
      this.loadFlashingStatus(),
    ])
      .pipe(
        tap(([ipmiData]) => {
          this.setFormValues(ipmiData[0]);
        }),
        switchMap(() => this.loadFailoverData()),
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.isLoading.set(false);
        },
      });
  }

  private createControllerOptions(node: string): void {
    const currentControllerLabel = (node === 'A') ? '1' : '2';
    const failoverControllerLabel = (node === 'A') ? '2' : '1';
    this.remoteControllerOptions = of([
      {
        label: this.translate.instant('Active: TrueNAS Controller {id}', { id: currentControllerLabel }),
        value: false,
      },
      {
        label: this.translate.instant('Standby: TrueNAS Controller {id}', { id: failoverControllerLabel }),
        value: true,
      },
    ]);
  }

  setFormValues(ipmi: Ipmi): void {
    this.form.patchValue({
      dhcp: ipmi.ip_address_source === IpmiIpAddressSource.UseDhcp,
      ipaddress: ipmi.ip_address || '',
      netmask: ipmi.subnet_mask || '',
      gateway: ipmi.default_gateway_ip_address || '',
      vlan_id: ipmi.vlan_id || null,
      vlan_id_enable: ipmi.vlan_id_enable,
    });

    // Set initial vlan_id validation based on vlan_id_enable state
    if (ipmi.vlan_id_enable) {
      this.form.controls.vlan_id.addValidators([Validators.required]);
    } else {
      this.form.controls.vlan_id.removeValidators([Validators.required]);
    }
    this.form.controls.vlan_id.updateValueAndValidity();

    // Update manage button state after form values are set
    this.updateManageButtonState();
  }

  private loadDataOnRemoteControllerChange(): void {
    let isUsingRemote: boolean;

    this.form.controls.apply_remote.valueChanges
      .pipe(
        switchMap((controlState) => {
          this.isLoading.set(true);
          isUsingRemote = !!controlState;
          if (this.queryParams?.length && controlState) {
            this.queryParams[0]['ipmi-options'] = { 'query-remote': controlState };
          }

          if (isUsingRemote) {
            return this.remoteControllerData
              ? of([this.remoteControllerData])
              : this.api.call('ipmi.lan.query', this.queryParams);
          }
          return this.defaultControllerData
            ? of([this.defaultControllerData])
            : this.api.call('ipmi.lan.query', this.queryParams);
        }),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((dataIpma) => {
        if (isUsingRemote) {
          this.remoteControllerData = dataIpma[0];
        } else {
          this.defaultControllerData = dataIpma[0];
        }

        this.setFormValues(dataIpma[0]);
        this.isLoading.set(false);
      });
  }

  onSubmit(): void {
    this.isLoading.set(true);

    const updateParams: IpmiUpdate = {
      dhcp: this.form.value.dhcp,
      gateway: this.form.value.gateway,
      ipaddress: this.form.value.ipaddress,
      netmask: this.form.value.netmask,
      vlan: this.form.value.vlan_id_enable ? this.form.value.vlan_id : null,
      password: this.form.value.password,
      apply_remote: this.form.value.apply_remote,
    };

    if (!updateParams.apply_remote) {
      delete updateParams.apply_remote;
    }
    if (!updateParams.password) {
      delete updateParams.password;
    }

    this.api.call('ipmi.lan.update', [this.ipmiId, updateParams])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.slideInRef.close({ response: true });
          this.snackbar.success(
            this.translate.instant('Successfully saved IPMI settings.'),
          );
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  private setFormRelations(): void {
    const stateDhcp$ = this.form.controls.dhcp.valueChanges;
    this.form.controls.ipaddress.disabledWhile(stateDhcp$);
    this.form.controls.gateway.disabledWhile(stateDhcp$);
    this.form.controls.netmask.disabledWhile(stateDhcp$);

    // Make vlan_id required only when vlan_id_enable is true
    this.form.controls.vlan_id_enable.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((vlanEnabled) => {
        if (vlanEnabled) {
          this.form.controls.vlan_id.addValidators([Validators.required]);
        } else {
          this.form.controls.vlan_id.removeValidators([Validators.required]);
          this.form.controls.vlan_id.setValue(null);
        }
        this.form.controls.vlan_id.updateValueAndValidity();
      });

    // Listen to both DHCP and IP address changes to update manage button state
    combineLatest([
      this.form.controls.dhcp.valueChanges,
      this.form.controls.ipaddress.valueChanges,
    ])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.updateManageButtonState();
      });
  }

  private updateManageButtonState(): void {
    const ipAddress = this.form.controls.ipaddress.value;
    const isIpInvalid = this.form.controls.ipaddress.invalid;

    this.managementIp = ipAddress;
    this.isManageButtonDisabled = !ipAddress || ipAddress === '0.0.0.0' || isIpInvalid;
  }

  private loadFlashingStatus(): Observable<unknown> {
    return this.api.call('ipmi.chassis.info').pipe(
      tap((ipmiStatus) => {
        this.isFlashing.set(ipmiStatus.chassis_identify_state !== IpmiChassisIdentifyState.Off);
      }),
      untilDestroyed(this),
    );
  }

  private loadFailoverData(): Observable<unknown> {
    return this.store$.select(selectIsEnterprise).pipe(
      switchMap((isEnterprise) => {
        if (!isEnterprise) {
          return of(null);
        }

        return this.store$.select(selectIsHaLicensed).pipe(
          switchMap((isHaLicensed) => {
            if (!isHaLicensed) {
              return of(null);
            }

            return this.api.call('failover.node').pipe(
              tap((node) => {
                this.createControllerOptions(node);
                this.loadDataOnRemoteControllerChange();
                this.form.controls.apply_remote.setValue(false);
              }),
            );
          }),
        );
      }),
    );
  }
}
