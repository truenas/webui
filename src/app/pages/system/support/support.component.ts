import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { WebSocketService } from '../../../services';
import { PreferencesService } from 'app/core/services/preferences.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector: 'app-support',
  templateUrl: './support.component.html',
  providers: [],
})
export class SupportComponent implements OnInit {
  product_type: string;
  scrshot: any;
  subs: any;
  isProduction: boolean;
  updateButton: any;
  FN_version;
  FN_model;
  FN_memory;
  FN_serial;
  FN_instructions;
  customer_name;
  features;
  contract_type;
  expiration_date;
  model;
  sys_serial;
  add_hardware;
  daysLeftinContract;
  product_image = '';

  custActions: any[] = [];

  constructor(protected ws: WebSocketService,
    protected prefService: PreferencesService) {}

  ngOnInit() {
    this.product_type = window.localStorage['product_type'];
    this.ws.call('system.info').subscribe((res) => {
      if (this.product_type === 'CORE') {
        this.getFNSysInfo(res);
      } else {
        this.getTNSysInfo(res);
      }

      // Always try to show product image for iX Systems hardware regardless of platform or license
      if (res.system_manufacturer.toLowerCase() == 'ixsystems' && res.system_product.includes('MINI')) {
        this.getFreeNASImage(res.system_product);
      } else {
        this.getTrueNASImage(res.system_product);
      }
    });
  }

  getFNSysInfo(res) {
    this.FN_version = res.version;
    this.FN_model = res.system_product;
    this.FN_memory = (res.physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB';
    res.system_serial ? this.FN_serial = res.system_serial : this.FN_serial = '';
    this.FN_instructions = helptext.FN_instructions;
  }

  getTNSysInfo(res) {
    this.model = res.system_product;
    if (res.license) {
      this.customer_name = res.license.customer_name;
      res.license.features.length === 0 ? this.features = 'NONE' : this.features = res.license.features.join(', ');
      this.contract_type = res.license.contract_type;
      const expDateConverted = new Date(res.license.contract_end.$value);
      this.expiration_date = res.license.contract_end.$value;
      res.license.system_serial_ha
        ? this.sys_serial = res.license.system_serial + ' / ' + res.license.system_serial_ha
        : this.sys_serial = res.license.system_serial;
      !res.license.addhw_detail || res.license.addhw_detail.length === 0
        ? this.add_hardware = 'NONE'
        : this.add_hardware = res.license.addhw_detail.join(', ');
      const now = new Date(res.datetime.$date);
      const then = expDateConverted;
      this.daysLeftinContract = this.daysTillExpiration(now, then);
    }
  }

  daysTillExpiration(now, then) {
    const oneDay = 24 * 60 * 60 * 1000; // milliseconds in a day
    return Math.round((then.getTime() - now.getTime()) / (oneDay));
  }

  getTrueNASImage(sys_product) {
    if (sys_product.includes('X10')) {
      this.product_image = '/servers/X10.png';
    } else if (sys_product.includes('X20')) {
      this.product_image = '/servers/X20.png';
    } else if (sys_product.includes('M30')) {
      this.product_image = '/servers/M30.png';
    } else if (sys_product.includes('M40')) {
      this.product_image = '/servers/M40.png';
    } else if (sys_product.includes('M50')) {
      this.product_image = '/servers/M50.png';
    } else if (sys_product.includes('M60')) {
      this.product_image = '/servers/M50.png';
    } else if (sys_product.includes('Z20')) {
      this.product_image = '/servers/Z20.png';
    } else if (sys_product.includes('Z35')) {
      this.product_image = '/servers/Z35.png';
    } else if (sys_product.includes('Z50')) {
      this.product_image = '/servers/Z50.png';
    } else if (sys_product.includes('R10')) {
      this.product_image = '/servers/R10.png';
    } else if (sys_product.includes('R20')) {
      this.product_image = '/servers/R20.png';
    } else if (sys_product.includes('R40')) {
      this.product_image = '/servers/R40.png';
    } else if (sys_product.includes('R50')) {
      this.product_image = '/servers/R50.png';
    } else {
      this.product_image = 'ix-original.png';
    }
  }

  getFreeNASImage(sys_product) {
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
        this.product_image = 'ix-original.png';
        break;
    }
  }
}
