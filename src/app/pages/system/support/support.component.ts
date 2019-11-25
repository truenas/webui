import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import * as moment from 'moment'
import { WebSocketService } from '../../../services/';
import { PreferencesService } from 'app/core/services/preferences.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';

@Component({
  selector : 'app-support',
  templateUrl: './support.component.html',
  providers: []
})
export class SupportComponent implements OnInit {
  public is_freenas: boolean;
  public isFooterConsoleOpen: boolean;
  public scrshot: any;
  public subs: any;
  public isProduction: boolean;
  public updateButton: any;
  public FN_version;
  public FN_model;
  public FN_memory;
  public FN_serial;
  public FN_instructions;
  public customer_name;
  public features;
  public contract_type;
  public expiration_date;
  public model;
  public sys_serial;
  public add_hardware;
  public daysLeftinContract;
  public product_image = '';

  public custActions: Array<any> = [];

  constructor(protected ws: WebSocketService,
              protected prefService: PreferencesService)
              {}

  ngOnInit() {
    window.localStorage['is_freenas'] === 'true' ? this.is_freenas = true : this.is_freenas = false;
    this.ws.call('system.info').subscribe((res) => {
      if (this.is_freenas) {
        this.getFNSysInfo(res);
        this.getFreeNASImage(res.system_product)
      } else {
        this.getTNSysInfo(res);
        this.getTrueNASImage(res.system_product);
      };
    });
    setTimeout(() => {
      this.ws.call('system.advanced.config').subscribe((res)=> {
        if (res) {
          this.isFooterConsoleOpen = res.consolemsg;
        }
      });
    }, 500);
  };

  getFNSysInfo(res) {
    this.FN_version = res.version;
    this.FN_model = res.system_product;
    this.FN_memory = (res.physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB'
    res.system_serial ? this.FN_serial = res.system_serial : this.FN_serial = '';
    this.FN_instructions = helptext.FN_instructions;
  }

  getTNSysInfo(res) { console.log(res)
    this.model = res.system_product;
    if (res.license) {
      this.customer_name = res.license.customer_name;
      res.license.features.length === 0 ? this.features = 'NONE' : this.features = res.license.features.join(', ');
      this.contract_type = res.license.contract_type;
      let expDateConverted = new Date(res.license.contract_end.$value);
      this.expiration_date = moment(expDateConverted).format('YYYY-MM-DD');
      res.license.system_serial_ha ?
          this.sys_serial = res.license.system_serial + ' / ' + res.license.system_serial_ha :
          this.sys_serial = res.license.system_serial;
      res.license.addhw.length === 0 ? this.add_hardware = 'NONE' : this.add_hardware = res.license.addhw.join(', ');
      const now = new Date(res.datetime.$date);
      const then = expDateConverted;
      this.daysLeftinContract = this.daysTillExpiration(now, then);
    };
  }

  daysTillExpiration(now, then) {
    const oneDay = 24*60*60*1000; // milliseconds in a day
    return Math.round((then.getTime() - now.getTime())/(oneDay))
  }

  getTrueNASImage(sys_product) {
    if (sys_product.includes('X10')) {
      this.product_image = '/servers/X10.png';
    } else if (sys_product.includes('X20')) {
      this.product_image = '/servers/X20.png';
    } else if (sys_product.includes('M40')) {
      this.product_image = '/servers/M40.png';
    }  else if (sys_product.includes('M50')) {
      this.product_image = '/servers/M50.png';
    } else if (sys_product.includes('Z20')) {
      this.product_image = '/servers/Z20.png';
    } else if (sys_product.includes('M50')) {
      this.product_image = '/servers/M50.png';
    } else if (sys_product.includes('Z35')) {
      this.product_image = '/servers/Z35.png';
    } else if (sys_product.includes('Z50')) {
      this.product_image = '/servers/Z50.png';
    }
    else {
      this.product_image = 'ix-original.png';
    }
  }

  getFreeNASImage(sys_product) {
    switch(sys_product){
      case "FREENAS-MINI-2.0":
        this.product_image = 'freenas_mini_cropped.png';
      break;
      case "FREENAS-MINI-XL":
        this.product_image = 'freenas_mini_xl_cropped.png';
      break;
      default:
        this.product_image = 'ix-original.png';
      break;
    }
  }
}
