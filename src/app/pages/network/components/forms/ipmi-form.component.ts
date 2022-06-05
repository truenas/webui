import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/network/ipmi/ipmi';
import { Ipmi, IpmiUpdate } from 'app/interfaces/ipmi.interface';
import { RadioOption } from 'app/interfaces/option.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import { ipv4Validator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import IxValidatorsService from 'app/modules/ix-forms/services/ix-validators.service';
import {
  IpmiIdentifyDialogComponent,
} from 'app/pages/network/components/ipmi-identify-dialog/ipmi-identify-dialog.component';
import { IpmiRow } from 'app/pages/network/interfaces/network-dashboard.interface';
import { DialogService, RedirectService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-ipmi',
  templateUrl: './ipmi-form.component.html',
  styleUrls: ['./ipmi-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpmiFormComponent implements OnInit {
  readonly controllerName = 'TrueNAS Controller';
  readonly title = 'IPMI'; //
  readonly helptext = helptext;
  dataForm: Ipmi;
  remoteContrData: Ipmi;
  isDisabledManageBtn = false;
  currentControllerLabel: string;
  failoverControllerLabel: string;
  remoteControllerOptions: Observable<RadioOption[]>;
  isLoading = false;
  managementIp: string;
  idIpmi: number;
  queryFilter: QueryParams<Ipmi>;
  form = this.fb.group({
    remoteController: [null as number],
    dhcp: [false],
    ipaddress: ['', [
      this.validatorsService.withMessage(
        ipv4Validator(),
        this.translate.instant(helptext.ip_error),
      ),
    ]],
    gateway: ['', [
      this.validatorsService.withMessage(
        ipv4Validator(),
        this.translate.instant(helptext.ip_error),
      ),
    ]],
    netmask: ['', [
      this.validatorsService.withMessage(
        ipv4Validator(),
        this.translate.instant(helptext.ip_error),
      ),
    ]],
    vlan: [null as number], // unknown
    password: ['', [
      this.validatorsService.withMessage(
        Validators.maxLength(20),
        this.translate.instant(helptext.password_errors),
      ),
    ]],
  });

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private redirect: RedirectService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private validatorsService: IxValidatorsService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.prepareDataForm();

    const stateDhcp$ = this.form.controls['dhcp'].valueChanges;
    this.form.controls['ipaddress'].disabledWhile(stateDhcp$);
    this.form.controls['gateway'].disabledWhile(stateDhcp$);
    this.form.controls['netmask'].disabledWhile(stateDhcp$);

    this.form.controls['ipaddress'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.isDisabledManageBtn = (value === '0.0.0.0' || value === '' || this.form.controls['dhcp'].value || this.form.controls['ipaddress'].invalid);
        this.managementIp = value;
      });
  }

  setIpmiForm(dataForm: IpmiRow): void {
    this.dataForm = { ...dataForm };
  }

  setFlashTime(): void {
    this.matDialog.open(IpmiIdentifyDialogComponent);
  }

  openManageWindow(): void {
    this.redirect.openWindow(`http://${this.managementIp}`); // valuechange ipaddress
  }

  prepareDataForm(): void {
    this.isLoading = true;

    if (window.localStorage.getItem('product_type') === ProductType.ScaleEnterprise) {
      this.ws.call('failover.licensed').pipe(
        switchMap((isHa) => {
          if (isHa) {
            return this.ws.call('failover.node');
          }
          return of(isHa);
        }),
        untilDestroyed(this),
      )
        .subscribe((node) => {
          if (node) {
            this.createOptions(node as string);
            this.loadDataRemoteContr();
            this.form.controls['remoteController'].setValue(0);
            this.isLoading = false;
            this.cdr.markForCheck();
          } else {
            this.setFormValues(this.dataForm);
            this.cdr.markForCheck();
          }
        });
    }
  }

  createOptions(node: string): void {
    this.currentControllerLabel = (node === 'A') ? '1' : '2';
    this.failoverControllerLabel = (node === 'A') ? '2' : '1';
    this.remoteControllerOptions = of([
      // value: 0 the same as false
      {
        label: `Active: ${this.controllerName} ${this.currentControllerLabel}`,
        value: 0,
      },
      // value: 1 the same as true
      {
        label: `Standby: ${this.controllerName} ${this.failoverControllerLabel}`,
        value: 1,
      },
    ]);
  }

  setFormValues(ipmi: Ipmi): void {
    this.idIpmi = ipmi.id;
    this.form.controls['dhcp'].setValue(ipmi.dhcp);
    this.form.controls['ipaddress'].setValue(ipmi.ipaddress);
    this.form.controls['netmask'].setValue(ipmi.netmask);
    this.form.controls['gateway'].setValue(ipmi.gateway);
    this.form.controls['vlan'].setValue(ipmi.vlan as number); // переписать с помощью цыкла
  }

  loadDataRemoteContr(): void {
    if (this.remoteContrData) {
      this.setFormValues(this.remoteContrData);
      return;
    }

    const filterQuery: QueryParams<Ipmi> = [[['id', '=', this.dataForm.id]]];
    this.form.controls['remoteController'].valueChanges
      .pipe(
        switchMap((state) => {
          if (state && !this.remoteContrData) {
            return this.ws.call('failover.call_remote', ['ipmi.query', filterQuery]) as Observable<Ipmi[]>;
          }
          if (state && this.remoteContrData) {
            return of([this.remoteContrData]);
          }
          return of(false);
        }),
        untilDestroyed(this),
      )
      .subscribe((data) => {
        if (data && (Array.isArray(data))) {
          this.remoteContrData = this.remoteContrData ? this.remoteContrData : data[0];
          this.setFormValues(data[0]);
        } else {
          this.setFormValues(this.dataForm);
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      });
  }

  onSubmit(): void {
    this.isLoading = true;

    const value = { ...this.form.value };
    delete value.remoteController;
    const ipmiUpdate: IpmiUpdate = { ...value };
    let call$ = this.ws.call('ipmi.update', [this.idIpmi, ipmiUpdate]);
    if (this.form.controls['remoteController'].value) {
      call$ = this.ws.call('failover.call_remote', ['ipmi.update', [this.idIpmi, ipmiUpdate]]) as Observable<Ipmi>;
    }

    call$.pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.isLoading = false;
          this.slideInService.close();
          this.dialogService.info(
            this.translate.instant('Settings saved.'),
            this.translate.instant('Successfully saved IPMI settings.'), true,
          );
        },
        (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      );
  }
}
