import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { WebSocketService, AppLoaderService, DialogService } from '../../../../services';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ModalService } from '../../../../services/modal.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { LicenseComponent } from './license/license.component';
import { SupportFormLicensedComponent } from './support-licensed/support-form-licensed.component';
import { SupportFormUnlicensedComponent } from './support-unlicensed/support-form-unlicensed.component';
import { ProactiveComponent } from './proactive/proactive.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector : 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['../general-settings.component.scss'],
  providers: []
})
export class SupportComponent implements OnInit {
  public scrshot: any;
  public subs: any;
  public isProduction: boolean;
  public updateButton: any;
  public FN_instructions;
  public product_image = '';
  public isProductImageTall = false;
  public serverList = ['M40', 'M50', 'X10', 'X20', 'Z20', 'Z30', 'Z35', 'Z50'];
  public systemInfo: any;
  public hasLicense = false;
  public licenseInfo = null;
  public links = [helptext.docHub, helptext.forums, helptext.licensing];
  public licenseButtonText: string;
  public ticketText = helptext.ticket;
  public proactiveText = helptext.proactive.title;

  protected licenseComponent = new LicenseComponent(this.ws,this.modalService,this.loader,this.dialog);
  protected supportFormLicensed = new SupportFormLicensedComponent(this.mdDialog,this.loader,
    this.ws,this.dialog,this.router,this.modalService);
  protected supportFormUnlicensed = new SupportFormUnlicensedComponent(this.ws,this.mdDialog,this.modalService);
  protected proactiveComponent = new ProactiveComponent(this.ws,this.loader,this.dialog,this.translate);

  public custActions: Array<any> = [];

  constructor(protected ws: WebSocketService,
              protected prefService: PreferencesService,
              private modalService: ModalService, private loader: AppLoaderService,
              private dialog: DialogService, private mdDialog: MatDialog,
              private router: Router, private translate: TranslateService)
              {}

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
      console.log(res)
      this.systemInfo = res;
      this.systemInfo.memory = (res.physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB';
      if (res.system_product.includes('MINI')) {
        this.getMiniImage(res.system_product)
      } else {
        this.getServerImage(res.system_product);
      };
      if (res.license) {
        this.hasLicense = true;
        this.licenseInfo = res.license;
        this.parseLicenseInfo();
        this.ws.call('support.is_available').subscribe(res => {
          if (res) {
            this.ws.call('support.is_available_and_enabled').subscribe(res => {
              console.log(res)
            })
          }
        })
      }
      this.licenseButtonText = this.hasLicense ? helptext.updateTxt : helptext.enterTxt;
    });
  };

  parseLicenseInfo() {
    this.licenseInfo.features.length === 0 ? this.licenseInfo.featuresString = 'NONE' : 
      this.licenseInfo.featuresString = this.licenseInfo.features.join(', ');
    let expDateConverted = new Date(this.licenseInfo.contract_end.$value);
    this.licenseInfo.expiration_date = this.licenseInfo.contract_end.$value;
    this.systemInfo.system_serial_ha ?
        this.systemInfo.serial = this.systemInfo.system_serial + ' / ' + this.systemInfo.system_serial_ha :
        this.systemInfo.serial = this.systemInfo.system_serial;
    this.licenseInfo.addhw.length === 0 ? this.licenseInfo.add_hardware = 'NONE' : 
      this.licenseInfo.add_hardware = this.licenseInfo.addhw.join(', ');
    const now = new Date(this.systemInfo.datetime.$date);
    const then = expDateConverted;
    this.licenseInfo.daysLeftinContract = this.daysTillExpiration(now, then);
  }

  daysTillExpiration(now, then) {
    const oneDay = 24*60*60*1000; // milliseconds in a day
    return Math.round((then.getTime() - now.getTime())/(oneDay))
  }

  getServerImage(sys_product) {
    let imagePath = '';
    this.serverList.forEach(model => {
      if (sys_product.includes(model)) {
        imagePath = `/servers/${model}.png`;
      }
    })
    if (imagePath) {
      this.product_image = imagePath;
    } else {
      this.product_image = 'ix-original-cropped.png';
      this.isProductImageTall = true;
    }
  }

  getMiniImage(sys_product) {
    switch(sys_product){
      case "FREENAS-MINI-2.0":
      case "FREENAS-MINI-3.0-E":
      case "FREENAS-MINI-3.0-E+":
        this.product_image = 'freenas_mini_cropped.png';
      break;
      case "FREENAS-MINI-3.0-X":
      case "FREENAS-MINI-3.0-X+":
        this.product_image = 'freenas_mini_x_cropped.png';
      break;
      case "FREENAS-MINI-XL":
      case "FREENAS-MINI-3.0-XL+":
        this.product_image = 'freenas_mini_xl_cropped.png';
      break;
      default:
        this.product_image = 'ix-original-cropped.png';
      break;
    }
    this.isProductImageTall = true;
  }

  updateLicense() {
      this.modalService.open('slide-in-form', this.licenseComponent);
  }

  fileTicket() {
    const component = this.hasLicense ? this.supportFormLicensed : this.supportFormUnlicensed;
    this.modalService.open('slide-in-form', component);
  }

  openProactive() {
    this.modalService.open('slide-in-form', this.proactiveComponent);
  }
}
