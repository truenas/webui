import { Component } from '@angular/core';
import { MatDialog } from '@angular/material';
import { Router } from '@angular/router';
import * as _ from 'lodash';
import { WebSocketService } from '../../../services/';
import { DialogService } from '../../../services/dialog.service';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { PreferencesService } from 'app/core/services/preferences.service';
import { helptext_system_support as helptext } from 'app/helptext/system/support';
import { SnackbarService } from '../../../services/snackbar.service';

@Component({
  selector : 'app-support',
  templateUrl: './support.component.html',
  styleUrls: ['./support.component.scss'],
  providers: [SnackbarService]
})
export class SupportComponent {
  public entityEdit: any;
  public saveSubmitText = "Submit";
  public is_freenas: boolean;
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

  constructor(protected router: Router, protected ws: WebSocketService,
              protected dialog: MatDialog, protected dialogService: DialogService,
              protected prefService: PreferencesService,
              public loader: AppLoaderService, private snackbar: SnackbarService)
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
  }

  getFNSysInfo(res) {
    this.FN_version = res.version;
    this.FN_model = res.system_product;
    this.FN_memory = (res.physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB'
    res.system_serial ? this.FN_serial = res.system_serial : this.FN_serial = '';
    this.FN_instructions = helptext.FN_instructions;
  }

  getTNSysInfo(res) {
    this.model = res.system_product;
    if (res.license) {
      this.customer_name = res.license.customer_name;
      res.license.features.length === 0 ? this.features = 'NONE' : this.features = res.license.features.join(', ');
      this.contract_type = res.license.contract_type;
      this.expiration_date =res.license.contract_end.$value;
      res.license.system_serial_ha ?
          this.sys_serial = res.license.system_serial + ' / ' + res.license.system_serial_ha :
          this.sys_serial = res.license.system_serial;
      res.license.addhw.length === 0 ? this.add_hardware = 'NONE' : this.add_hardware = res.license.addhw.join(', ');
      const now = new Date();
      const then = new Date(res.license.contract_end.$value);
      this.daysLeftinContract = this.daysTillExpiration(now, then);
    };
  }

  daysTillExpiration(now, then) {
    const oneDay = 24*60*60*1000; // milliseconds in a day
    return Math.round(Math.abs((now.getTime() - then.getTime())/(oneDay)));
  }

  afterInit(entityEdit: any) {
    this.entityEdit = entityEdit;
      this.ws.call('truenas.is_production').subscribe((res) => {
        this.isProduction = res;
        this.entityEdit.formGroup.controls['TN_is_production'].setValue(this.isProduction);
        setTimeout(() => {
          this.updateButton = <HTMLInputElement> document.getElementById('cust_button_Update');
        }, 500)

        this.entityEdit.formGroup.controls['TN_is_production'].valueChanges.subscribe(() => {
          this.updateButton.disabled = false;
        });
        this.entityEdit.formGroup.controls['TN_send_debug'].valueChanges.subscribe(() => {
          this.updateButton.disabled = false;
        });
      });
      this.custActions = [
        {
          id : 'change_prod_status',
          name: 'Update',
          disabled: true,
          function : () => {
            let prod_status = this.entityEdit.formGroup.controls['TN_is_production'].value;
            let debug_status = this.entityEdit.formGroup.controls['TN_send_debug'].value;
            this.loader.open();
            if (prod_status) {
              this.ws.call('truenas.set_production',[true, debug_status]).subscribe(() => {
                this.loader.close();
                this.updateButton.disabled = true;
                this.snackbar.open(helptext.is_production_snackbar.message, helptext.is_production_snackbar.action,
                  { duration: 6000 } );
              },
              (err) => {
                this.loader.close();
                this.dialogService.errorReport(helptext.is_production_error_dialog.title, err.reason, err.trace.formatted);
              });
            } else {
              this.ws.call('truenas.set_production', [false]).subscribe(() => {
                this.loader.close();
                this.updateButton.disabled = true;
                this.snackbar.open(helptext.is_production_snackbar.message, helptext.is_production_snackbar.action,
                  { duration: 6000 } );              },
              (err) => {
                this.loader.close();
                this.dialogService.errorReport(helptext.is_production_error_dialog.title, err.reason, err.trace.formatted);
              });
            }
          }
        }
      ]
    };

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
      this.product_image = 'ix-original.svg';
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
        this.product_image = 'ix-original.svg';
      break;
    }
  }
}
