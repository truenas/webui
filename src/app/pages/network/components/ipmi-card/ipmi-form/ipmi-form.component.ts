import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { IpmiChassisIdentifyState, IpmiIpAddressSource } from 'app/enums/ipmi.enum';
import { OnOff } from 'app/enums/on-off.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextIpmi } from 'app/helptext/network/ipmi/ipmi';
import { Ipmi, IpmiQueryParams, IpmiUpdate } from 'app/interfaces/ipmi.interface';
import { RadioOption } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { ipv4Validator } from 'app/modules/ix-forms/validators/ip-validation';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { RedirectService } from 'app/services/redirect.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  templateUrl: './ipmi-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpmiFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.IpmiWrite];

  remoteControllerData: Ipmi;
  defaultControllerData: Ipmi;
  isManageButtonDisabled = false;
  remoteControllerOptions: Observable<RadioOption[]>;
  isLoading = false;
  managementIp: string;
  isFlashing = false;

  queryParams: IpmiQueryParams;

  readonly helptext = helptextIpmi;

  form = this.fb.group({
    apply_remote: [null as boolean],
    dhcp: [false],
    ipaddress: ['', [
      this.validatorsService.withMessage(
        ipv4Validator(),
        this.translate.instant(helptextIpmi.ip_error),
      ),
    ]],
    gateway: ['', [
      this.validatorsService.withMessage(
        ipv4Validator(),
        this.translate.instant(helptextIpmi.ip_error),
      ),
    ]],
    netmask: ['', [
      this.validatorsService.withMessage(
        ipv4Validator(),
        this.translate.instant(helptextIpmi.ip_error),
      ),
    ]],
    vlan: [null as number],
    password: ['', [
      this.validatorsService.withMessage(
        Validators.maxLength(20),
        this.translate.instant(helptextIpmi.password_errors),
      ),
    ]],
  });

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private redirect: RedirectService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private validatorsService: IxValidatorsService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    private systemGeneralService: SystemGeneralService,
    private store$: Store<AppState>,
    private dialogService: DialogService,
    private slideInRef: IxSlideInRef<IpmiFormComponent>,
    @Inject(SLIDE_IN_DATA) private ipmiId: number,
  ) { }

  ngOnInit(): void {
    this.setFormRelations();
    this.loadFormData();

    if (this.ipmiId) {
      this.setIdIpmi();
    }
  }

  setIdIpmi(): void {
    this.queryParams = [{
      'query-filters': [['id', '=', this.ipmiId]],
    }];
  }

  toggleFlashing(): void {
    this.ws.call('ipmi.chassis.identify', [this.isFlashing ? OnOff.Off : OnOff.On])
      .pipe(this.errorHandler.catchError(), untilDestroyed(this))
      .subscribe(() => {
        this.snackbar.success(
          this.isFlashing
            ? this.translate.instant('Identify light is now off.')
            : this.translate.instant('Identify light is now flashing.'),
        );
        this.isFlashing = !this.isFlashing;
        this.cdr.markForCheck();
      });
  }

  openManageWindow(): void {
    this.redirect.openWindow(`https://${this.managementIp}`);
  }

  loadFormData(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    forkJoin([
      this.ws.call('ipmi.lan.query', this.queryParams),
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
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.dialogService.error(this.errorHandler.parseError(error));
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  createControllerOptions(node: string): void {
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
      vlan: ipmi.vlan_id || null,
    });
  }

  loadDataOnRemoteControllerChange(): void {
    let isUsingRemote: boolean;

    this.form.controls.apply_remote.valueChanges
      .pipe(
        switchMap((controlState) => {
          this.isLoading = true;
          isUsingRemote = controlState;
          if (this.queryParams?.length && controlState) {
            this.queryParams[0]['ipmi-options'] = { 'query-remote': controlState };
          }

          if (isUsingRemote) {
            return this.remoteControllerData
              ? of([this.remoteControllerData])
              : this.ws.call('ipmi.lan.query', this.queryParams);
          }
          return this.defaultControllerData
            ? of([this.defaultControllerData])
            : this.ws.call('ipmi.lan.query', this.queryParams);
        }),
        untilDestroyed(this),
      )
      .subscribe((dataIpma) => {
        if (isUsingRemote) {
          this.remoteControllerData = dataIpma[0];
        } else {
          this.defaultControllerData = dataIpma[0];
        }

        this.setFormValues(dataIpma[0]);
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    this.isLoading = true;

    const updateParams: IpmiUpdate = { ...this.form.value };
    if (!updateParams.apply_remote) {
      delete updateParams.apply_remote;
    }
    if (!updateParams.password) {
      delete updateParams.password;
    }
    if (!updateParams.vlan) {
      delete updateParams.vlan;
    }
    this.ws.call('ipmi.lan.update', [this.ipmiId, updateParams])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInRef.close(true);
          this.snackbar.success(
            this.translate.instant('Successfully saved IPMI settings.'),
          );
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  private setFormRelations(): void {
    const stateDhcp$ = this.form.controls.dhcp.valueChanges;
    this.form.controls.ipaddress.disabledWhile(stateDhcp$);
    this.form.controls.gateway.disabledWhile(stateDhcp$);
    this.form.controls.netmask.disabledWhile(stateDhcp$);

    this.form.controls.ipaddress.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.isManageButtonDisabled = (value === '0.0.0.0' || value === '' || this.form.controls.dhcp.value || this.form.controls.ipaddress.invalid);
        this.managementIp = value;
      });
  }

  private loadFlashingStatus(): Observable<unknown> {
    return this.ws.call('ipmi.chassis.info').pipe(
      tap((ipmiStatus) => {
        this.isFlashing = ipmiStatus.chassis_identify_state !== IpmiChassisIdentifyState.Off;
        this.cdr.markForCheck();
      }),
      untilDestroyed(this),
    );
  }

  private loadFailoverData(): Observable<unknown> {
    if (this.systemGeneralService.getProductType() !== ProductType.ScaleEnterprise) {
      return of(null);
    }

    return this.store$.select(selectIsHaLicensed).pipe(
      switchMap((isHaLicensed) => {
        if (!isHaLicensed) {
          return of(null);
        }

        return this.ws.call('failover.node').pipe(
          tap((node) => {
            this.createControllerOptions(node);
            this.loadDataOnRemoteControllerChange();
            this.form.controls.apply_remote.setValue(false);
          }),
        );
      }),
    );
  }
}
