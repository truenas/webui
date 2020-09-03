import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { WebSocketService, AppLoaderService, DialogService } from '../../../services/';
import { PreferencesService } from 'app/core/services/preferences.service';
import { ModalService } from '../../../services/modal.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { LicenseComponent } from './license/license.component';

@Component({
  selector : 'app-support',
  templateUrl: './support.component.html',
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
  public licenseInfo: any;
  public links = [helptext.docHub, helptext.forums, helptext.licensing];

  protected addComponent = new LicenseComponent(this.ws,this.modalService,this.loader,this.dialog);

  public custActions: Array<any> = [];

  constructor(protected ws: WebSocketService,
              protected prefService: PreferencesService,
              private modalService: ModalService, private loader: AppLoaderService,
              private dialog: DialogService)
              {}

  ngOnInit() {
    this.ws.call('system.info').subscribe((res) => {
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
      }
    });
  };

  parseLicenseInfo() {
    this.licenseInfo.features.length === 0 ? this.licenseInfo.featuresString = 'NONE' : 
      this.licenseInfo.featuresString = this.licenseInfo.features.join(', ');
    let expDateConverted = new Date(this.licenseInfo.contract_end.$value);
    this.licenseInfo.expiration_date = this.licenseInfo.contract_end.$value;
    this.licenseInfo.system_serial_ha ?
        this.licenseInfo.sys_serial = this.licenseInfo.system_serial + ' / ' + this.licenseInfo.system_serial_ha :
        this.licenseInfo.sys_serial = this.licenseInfo.system_serial;
    this.licenseInfo.addhw.length === 0 ? this.licenseInfo.add_hardware = 'NONE' : 
      this.licenseInfo.add_hardware = this.licenseInfo.addhw.join(', ');
    const now = new Date(this.licenseInfo.datetime.$date);
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
      this.product_image = 'ix-original.png';
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
        this.product_image = 'ix-original.png';
      break;
    }
    this.isProductImageTall = true;
  }

  updateLicense() {
      this.modalService.open('slide-in-form', this.addComponent);
  }

  fileTicket() {
    console.log('file a ticket')
  }
}
