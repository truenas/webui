import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services/dialog.service';
import { StorageService } from '../../../../services/storage.service';
import helptext from '../../../../helptext/storage/disks/disk-form';

@Component({
  selector: 'app-disk-bulk-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DiskBulkEditComponent {

  protected route_success: string[] = ['storage', 'disks'];
  protected isEntity = true;

  protected fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.bulk_edit.title,
      class: 'disks',
      label:true,
      config:[
        {
          type: 'input',
          name: 'disk_name',
          placeholder: helptext.bulk_edit.disks.placeholder,
          tooltip : helptext.bulk_edit.disks.tooltip,
          value: [this.diskBucket.diskNames],
          readonly: true
        }
      ]
    }, {
      name: helptext.bulk_edit.label,
      class: 'settings',
      label:true,
      config:[
        {
          type: 'input',
          name: 'disk_serial',
          placeholder: helptext.bulk_edit.serial.placeholder,
          tooltip : helptext.bulk_edit.serial.tooltip,
          value: [this.diskBucket.ids],
          readonly: true,
          isHidden: true
        },
        {
          type: 'select',
          name: 'disk_hddstandby',
          value: this.diskBucket.hddStandby,
          placeholder: helptext.disk_form_hddstandby_placeholder,
          tooltip : helptext.disk_form_hddstandby_tooltip,
          options: helptext.disk_form_hddstandby_options,
        },
        {
          type: 'select',
          name: 'disk_advpowermgmt',
          placeholder: helptext.disk_form_advpowermgmt_placeholder,
          value: this.diskBucket.advPowerMgt,
          tooltip : helptext.disk_form_advpowermgmt_tooltip,
          options: helptext.disk_form_advpowermgmt_options,
        },
        {
          type: 'select',
          name: 'disk_acousticlevel',
          placeholder: helptext.disk_form_acousticlevel_placeholder,
          value: this.diskBucket.acousticLevel,
          tooltip : helptext.disk_form_acousticlevel_tooltip,
          options: helptext.disk_form_acousticlevel_options,
        },
        {
          type : 'checkbox',
          name : 'disk_togglesmart',
          placeholder : helptext.disk_form_togglesmart_placeholder,
          value: this.diskBucket.diskToggleStatus,
          tooltip : helptext.disk_form_togglesmart_tooltip,
        },
        {
          type: 'input',
          name: 'disk_smartoptions',
          placeholder: helptext.disk_form_smartoptions_placeholder,
          value: this.diskBucket.SMARToptions,
          tooltip : helptext.disk_form_smartoptions_tooltip,
        }
      ]
    }
  ];

  protected disk_hddstandby: any;
  protected disk_advpowermgmt: any;
  protected disk_acousticlevel: any;
  protected entityList: any;

  constructor(
    private _router: Router,
    private dialogService: DialogService,
    protected ws: WebSocketService,
    protected aroute: ActivatedRoute,
    protected loader: AppLoaderService,
    public diskBucket: StorageService
  ) {
    this.aroute.params.subscribe((params)=> {
      if (params['poolId']) {
        this.route_success = ["storage", "pools", "status", params['poolId']];
      }
    })
  }

  afterInit(entityEdit: any) {
    if (!this.diskBucket.ids) {
      this._router.navigate(this.route_success);
    }
  }

  customSubmit(event) {
    this.loader.open();
    let req = []
    let data = {
      "hddstandby": event.disk_hddstandby,
      "advpowermgmt" : event.disk_advpowermgmt,
      "acousticlevel" : event.disk_acousticlevel,
      "togglesmart" : event.disk_togglesmart,
      "smartoptions" : event.disk_smartoptions
    }

    if (!data.togglesmart) {
      data.smartoptions = '';
    }

    for (let i of event.disk_serial[0]) {
      req.push([i, data])
    }

    this.ws.job('core.bulk', ["disk.update", req])
      .subscribe(
        (res) => {
          if(res.state === 'SUCCESS') {
            this.loader.close();
            let success_state = true;
            for (let i = 0; i < res.result.length; i++) {
              if (res.result[i].error != null) {
                this.dialogService.errorReport(helptext.dialog_error, res.result[i].error);
                success_state = false;
                break;
              }
            }
            if (success_state) {
              this._router.navigate(this.route_success);
            }
          }
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(helptext.dialog_error, err.reason, err.trace.formatted);
        }
      )
  }

}
