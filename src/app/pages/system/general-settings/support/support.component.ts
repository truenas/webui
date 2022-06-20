import { Component, OnInit } from '@angular/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { delay } from 'rxjs/operators';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';
import { WebSocketService, AppLoaderService, DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';
import { FileTicketFormComponent } from './file-ticket-form/file-ticket-form.component';
import { FileTicketLicensedFormComponent } from './file-ticket-licensed-form/file-ticket-licensed-form.component';
import { LicenseComponent } from './license/license.component';
import { ProactiveComponent } from './proactive/proactive.component';

@UntilDestroy()
@Component({
  selector: 'ix-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
})
export class SupportComponent implements OnInit {
  isProduction: boolean;
  productImage = 'ix-original-cropped.png';
  isProductImageRack = false;
  extraMargin = true;
  serverList = ['M40', 'M50', 'X10', 'X20', 'Z20', 'Z30', 'Z35', 'Z50'];
  systemInfo: SystemInfoInSupport;
  hasLicense = false;
  licenseInfo: LicenseInfoInSupport = null;
  links = [helptext.docHub, helptext.forums, helptext.licensing];
  ticketText = helptext.ticket;
  proactiveText = helptext.proactive.title;

  get licenseButtonText(): string {
    return this.hasLicense ? helptext.updateTxt : helptext.enterTxt;
  }

  constructor(
    protected ws: WebSocketService,
    private loader: AppLoaderService,
    private dialog: DialogService,
    private slideInService: IxSlideInService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((systemInfo) => {
      this.systemInfo = { ...systemInfo };
      this.systemInfo.memory = (systemInfo.physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB';
      if (systemInfo.system_product.includes('MINI')) {
        this.getMiniImage(systemInfo.system_product);
      } else {
        this.getServerImage(systemInfo.system_product);
      }
      if (systemInfo.license) {
        this.hasLicense = true;
        this.licenseInfo = { ...systemInfo.license };
        this.parseLicenseInfo();
      }
    });
    this.ws.call('truenas.is_production').pipe(
      delay(500),
      untilDestroyed(this),
    ).subscribe((res) => {
      this.isProduction = res;
    });
  }

  parseLicenseInfo(): void {
    if (this.licenseInfo.features.length === 0) {
      this.licenseInfo.featuresString = 'NONE';
    } else {
      this.licenseInfo.featuresString = this.licenseInfo.features.join(', ');
    }
    const expDateConverted = new Date(this.licenseInfo.contract_end.$value);
    this.licenseInfo.expiration_date = this.licenseInfo.contract_end.$value;
    if (this.licenseInfo?.system_serial_ha) {
      this.systemInfo.serial = this.systemInfo.system_serial + ' / ' + this.licenseInfo.system_serial_ha;
    } else {
      this.systemInfo.serial = this.systemInfo.system_serial;
    }
    if (this.licenseInfo.addhw_detail.length === 0) {
      this.licenseInfo.add_hardware = 'NONE';
    } else {
      this.licenseInfo.add_hardware = this.licenseInfo.addhw_detail.join(', ');
    }
    const now = new Date(this.systemInfo.datetime.$date);
    const then = expDateConverted;
    this.licenseInfo.daysLeftinContract = this.daysTillExpiration(now, then);
  }

  daysTillExpiration(now: Date, then: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.round((then.getTime() - now.getTime()) / (oneDay));
  }

  getServerImage(sysProduct: string): void {
    let imagePath = '';
    this.serverList.forEach((model) => {
      if (sysProduct.includes(model)) {
        imagePath = `/servers/${model}.png`;
      }
    });
    if (imagePath) {
      this.isProductImageRack = true;
      this.productImage = imagePath;
    } else {
      this.productImage = 'ix-original-cropped.png';
      this.isProductImageRack = false;
      this.extraMargin = false;
    }
  }

  getMiniImage(sysProduct: string): void {
    switch (sysProduct) {
      case 'FREENAS-MINI-2.0':
      case 'FREENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
      case 'TRUENAS-MINI-3.0-E':
      case 'TRUENAS-MINI-3.0-E+':
        this.productImage = 'freenas_mini_cropped.png';
        break;
      case 'FREENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
      case 'TRUENAS-MINI-3.0-X':
      case 'TRUENAS-MINI-3.0-X+':
        this.productImage = 'freenas_mini_x_cropped.png';
        break;
      case 'FREENAS-MINI-XL':
      case 'FREENAS-MINI-3.0-XL+':
      case 'TRUENAS-MINI-3.0-XL+':
        this.productImage = 'freenas_mini_xl_cropped.png';
        break;
      default:
        // this.product_image = 'ix-original-cropped.png';
        this.productImage = 'freenas_mini_xl_cropped.png';
        break;
    }
    this.isProductImageRack = false;
    this.extraMargin = false;
  }

  updateLicense(): void {
    this.slideInService.open(LicenseComponent);
  }

  fileTicket(): void {
    if (this.hasLicense) {
      this.slideInService.open(FileTicketLicensedFormComponent, { wide: true });
    } else {
      this.slideInService.open(FileTicketFormComponent);
    }
  }

  openProactive(): void {
    this.slideInService.open(ProactiveComponent, { wide: true });
  }

  updateProductionStatus(event: MatCheckboxChange): void {
    if (event.checked) {
      this.dialog.dialogForm(this.updateProdStatusConf);
    } else {
      this.ws.call('truenas.set_production', [false, false]).pipe(untilDestroyed(this)).subscribe(() => {
        this.dialog.info(helptext.is_production_dialog.title, helptext.is_production_dialog.message);
      }, (err) => {
        this.loader.close();
        this.dialog.errorReport(
          helptext.is_production_error_dialog.title,
          err.error.message,
          err.error.traceback,
        );
      });
    }
  }

  protected updateProdStatus: FieldConfig[] = [
    {
      type: 'checkbox',
      name: 'send_debug',
      placeholder: helptext.updateProd.checkbox,
      value: false,
    },
  ];

  updateProdStatusConf: DialogFormConfiguration = {
    title: helptext.updateProd.title,
    fieldConfig: this.updateProdStatus,
    method_ws: 'truenas.set_production',
    saveButtonText: helptext.updateProd.button,
    customSubmit: this.doProdUpdate,
    message: helptext.updateProd.message,
  };

  doProdUpdate(entityDialog: EntityDialogComponent): void {
    const self = entityDialog;
    self.loader.open();
    const dialogRef = entityDialog.mdDialog.open(EntityJobComponent,
      { data: { title: helptext.is_production_job.title, closeOnClickOutside: false } });
    dialogRef.componentInstance.setDescription(helptext.is_production_job.message);

    self.ws.call(self.conf.method_ws, [true, self.formValue.send_debug]).pipe(untilDestroyed(this)).subscribe(() => {
      self.loader.close();
      self.dialogRef.close();
      dialogRef.componentInstance.setTitle(helptext.is_production_dialog.title);
      dialogRef.componentInstance.setDescription(helptext.is_production_dialog.message);
    },
    (err: any) => {
      self.loader.close();
      self.dialogRef.close();
      this.dialog.errorReport(helptext.is_production_error_dialog.title,
        err.error.message, err.error.traceback);
    });
  }
}
