import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PreferencesService } from 'app/core/services/preferences.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { EntityJobComponent } from 'app/pages//common/entity/entity-job/entity-job.component';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { WebSocketService, AppLoaderService, DialogService } from 'app/services';
import { ModalService } from 'app/services/modal.service';
import { LicenseComponent } from './license/license.component';
import { ProactiveComponent } from './proactive/proactive.component';
import { SupportFormLicensedComponent } from './support-licensed/support-form-licensed.component';
import { SupportFormUnlicensedComponent } from './support-unlicensed/support-form-unlicensed.component';

@UntilDestroy()
@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
})
export class SupportComponent implements OnInit {
  subs: any;
  isProduction: boolean;
  product_image = '';
  isProductImageRack = false;
  extraMargin = true;
  serverList = ['M40', 'M50', 'X10', 'X20', 'Z20', 'Z30', 'Z35', 'Z50'];
  systemInfo: any;
  hasLicense = false;
  licenseInfo: any = null;
  links = [helptext.docHub, helptext.forums, helptext.licensing];
  licenseButtonText: string;
  ticketText = helptext.ticket;
  proactiveText = helptext.proactive.title;

  protected licenseComponent = new LicenseComponent(this.ws, this.modalService, this.loader, this.dialog);
  protected supportFormLicensed = new SupportFormLicensedComponent(this.mdDialog, this.loader,
    this.ws, this.dialog, this.router, this.modalService);
  protected supportFormUnlicensed = new SupportFormUnlicensedComponent(this.ws, this.mdDialog, this.modalService);
  protected proactiveComponent = new ProactiveComponent(this.ws, this.loader, this.dialog, this.translate,
    this.modalService);

  constructor(protected ws: WebSocketService,
    protected prefService: PreferencesService,
    private modalService: ModalService, private loader: AppLoaderService,
    private dialog: DialogService, private mdDialog: MatDialog,
    private router: Router, private translate: TranslateService) {}

  ngOnInit(): void {
    this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe((systemInfo) => {
      this.systemInfo = systemInfo;
      this.systemInfo.memory = (systemInfo.physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB';
      if (systemInfo.system_product.includes('MINI')) {
        this.getMiniImage(systemInfo.system_product);
      } else {
        this.getServerImage(systemInfo.system_product);
      }
      if (systemInfo.license) {
        this.hasLicense = true;
        this.licenseInfo = systemInfo.license;
        this.parseLicenseInfo();
      }
      this.licenseButtonText = this.hasLicense ? helptext.updateTxt : helptext.enterTxt;
    });
    setTimeout(() => {
      this.ws.call('truenas.is_production').pipe(untilDestroyed(this)).subscribe((res) => {
        this.isProduction = res;
      });
    }, 500);
  }

  parseLicenseInfo(): void {
    this.licenseInfo.features.length === 0 ? this.licenseInfo.featuresString = 'NONE'
      : this.licenseInfo.featuresString = this.licenseInfo.features.join(', ');
    const expDateConverted = new Date(this.licenseInfo.contract_end.$value);
    this.licenseInfo.expiration_date = this.licenseInfo.contract_end.$value;
    this.systemInfo.system_serial_ha
      ? this.systemInfo.serial = this.systemInfo.system_serial + ' / ' + this.systemInfo.system_serial_ha
      : this.systemInfo.serial = this.systemInfo.system_serial;
    this.licenseInfo.addhw_detail.length === 0
      ? this.licenseInfo.add_hardware = 'NONE'
      : this.licenseInfo.add_hardware = this.licenseInfo.addhw_detail.join(', ');
    const now = new Date(this.systemInfo.datetime.$date);
    const then = expDateConverted;
    this.licenseInfo.daysLeftinContract = this.daysTillExpiration(now, then);
  }

  daysTillExpiration(now: Date, then: Date): number {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.round((then.getTime() - now.getTime()) / (oneDay));
  }

  getServerImage(sys_product: string): void {
    let imagePath = '';
    this.serverList.forEach((model) => {
      if (sys_product.includes(model)) {
        imagePath = `/servers/${model}.png`;
      }
    });
    if (imagePath) {
      this.isProductImageRack = true;
      this.product_image = imagePath;
    } else {
      this.product_image = 'ix-original-cropped.png';
      this.isProductImageRack = false;
      this.extraMargin = false;
    }
  }

  getMiniImage(sys_product: string): void {
    switch (sys_product) {
      case 'FREENAS-MINI-2.0':
      case 'FREENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
      case 'TRUENAS-MINI-3.0-E':
      case 'TRUENAS-MINI-3.0-E+':
        this.product_image = 'freenas_mini_cropped.png';
        break;
      case 'FREENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
      case 'TRUENAS-MINI-3.0-X':
      case 'TRUENAS-MINI-3.0-X+':
        this.product_image = 'freenas_mini_x_cropped.png';
        break;
      case 'FREENAS-MINI-XL':
      case 'FREENAS-MINI-3.0-XL+':
      case 'TRUENAS-MINI-3.0-XL+':
        this.product_image = 'freenas_mini_xl_cropped.png';
        break;
      default:
        // this.product_image = 'ix-original-cropped.png';
        this.product_image = 'freenas_mini_xl_cropped.png';
        break;
    }
    this.isProductImageRack = false;
    this.extraMargin = false;
  }

  updateLicense(): void {
    this.modalService.open('slide-in-form', this.licenseComponent);
  }

  fileTicket(): void {
    const component = this.hasLicense ? this.supportFormLicensed : this.supportFormUnlicensed;
    this.modalService.open('slide-in-form', component);
  }

  openProactive(): void {
    this.modalService.open('slide-in-form', this.proactiveComponent);
  }

  updateProductionStatus(e: any): void {
    if (e.checked) {
      this.dialog.dialogForm(this.updateProdStatusConf);
    } else {
      this.ws.call('truenas.set_production', [false, false]).pipe(untilDestroyed(this)).subscribe(() => {
        this.dialog.info(helptext.is_production_dialog.title,
          helptext.is_production_dialog.message, '300px', 'info', true);
      }, (err) => {
        this.loader.close();
        this.dialog.errorReport(helptext.is_production_error_dialog.title,
          err.error.message, err.error.traceback);
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

  doProdUpdate(entityDialog: EntityDialogComponent<this>): void {
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
