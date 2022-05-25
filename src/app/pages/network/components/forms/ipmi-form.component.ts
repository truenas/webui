import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ProductType } from 'app/enums/product-type.enum';
import globalHelptext from 'app/helptext/global-helptext';
import helptext from 'app/helptext/network/ipmi/ipmi';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import {
  IpmiIdentifyDialogComponent,
} from 'app/pages/network/components/ipmi-identify-dialog/ipmi-identify-dialog.component';
import { DialogService, RedirectService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-ipmi',
  templateUrl: './ipmi-form.component.html',
  styleUrls: ['./ipmi-form.component.scss'],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IpmiFormComponent implements OnInit {
  isHa = false;
  controllerName = globalHelptext.Ctrlr;
  currentControllerLabel: string;
  failoverControllerLabel: string;
  readonly title = 'IPMI'; //
  readonly helptext = helptext;
  remoteContrOptions: any; // any?

  queryCall = 'ipmi.query' as const; //
  isLoading = false;
  form = this.fb.group({
    remoteController: [null as boolean],
    dhcp: [false], // false or true
    ipaddress: [''], // add validator
    gateway: [''],
    netmask: [''],
    vlan: [''], // unknown
    password: [''],
  });

  managementIp: string;
  customActions = [
    {
      id: 'ipmi_identify',
      name: this.translate.instant('Identify Light'),
      function: () => {
        this.matDialog.open(IpmiIdentifyDialogComponent);
      },
    },
    {
      id: 'connect',
      name: this.translate.instant('Manage'),
      function: () => {
        this.redirect.openWindow(`http://${this.managementIp}`);
      },
    },
  ];

  queryKey = 'id';
  channelValue: number;
  isEntity = true;

  constructor(
    protected ws: WebSocketService,
    protected dialog: DialogService,
    protected loader: AppLoaderService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private redirect: RedirectService,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.prerequisite();
    this.form.controls['remoteController'].valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.loadDataRemoteContr();
      });
  }

  getId(id: any): void {
    this.channelValue = id;
  }

  onSubmit(): void {}

  setFlashTime(): void {
    this.matDialog.open(IpmiIdentifyDialogComponent);
  }

  openManageWindow(): void {
    this.redirect.openWindow(`http://${this.managementIp}`);
  }

  prerequisite(): void {
    this.isLoading = true;
    if (window.localStorage.getItem('product_type') === ProductType.ScaleEnterprise) {
      this.ws.call('failover.licensed').pipe(
        switchMap((isHa) => {
          this.isHa = isHa;
          if (isHa) {
            return this.ws.call('failover.node');
          }
          this.isLoading = false;
          return EMPTY; // проверить в дебагере что будет если вернеться empty
        }),
        untilDestroyed(this),
      )
        .subscribe((node) => {
          this.currentControllerLabel = (node === 'A') ? '1' : '2'; // radio lable
          this.failoverControllerLabel = (node === 'A') ? '2' : '1'; // radio lable
          this.remoteContrOptions = of([
            {
              label: `Active: ${this.controllerName} ${this.currentControllerLabel}`,
              value: false,
            },
            {
              label: `Standby: ${this.controllerName} ${this.failoverControllerLabel}`,
              value: true,
            },
          ]);
          this.isLoading = false;
        });
    }
  }

  loadDataRemoteContr(): void {
    let query$ = this.ws.call('ipmi.query', []);
    if (this.form.controls['remoteController'].value) {
      query$ = this.ws.call('failover.call_remote', ['ipmi.query', []]) as Observable<Ipmi[]>;
    }
    query$.pipe(untilDestroyed(this)).subscribe((res) => {
      const dataForm: any = { // any! and loader
        ...res[0],
      };
      delete dataForm.id;
      delete dataForm.channel;
      dataForm.vlan = '';

      this.form.patchValue(dataForm);
    });
  }
}
