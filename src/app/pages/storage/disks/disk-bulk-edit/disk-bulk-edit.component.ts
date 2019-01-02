import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
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
  protected resource_name: string = 'storage/disk/';
  protected isEntity = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'disk_name',
      placeholder: helptext.disk_form_bulk_edit_names_placeholder,
      tooltip : helptext.disk_form_bulk_edit_names_tooltip,
      value: [this.diskBucket.diskNames],
      readonly: true
    },    {
      type: 'input',
      name: 'disk_serial',
      placeholder: helptext.disk_form_serial_placeholder,
      tooltip : helptext.disk_form_bulk_edit_serial_tooltip,
      value: [this.diskBucket.ids],
      readonly: true, 
      isHidden: true
    },
    {
      type: 'select',
      name: 'disk_hddstandby',
      value: this.diskBucket.hddStandby,
      placeholder: helptext.disk_form_hddstandby_placeholder,
      tooltip : helptext.disk_form_bulk_edit_hddstandby_tooltip,
      options: [],
    },
    {
      type: 'select',
      name: 'disk_advpowermgmt',
      placeholder: helptext.disk_form_advpowermgmt_placeholder,
      value: this.diskBucket.advPowerMgt,
      tooltip : helptext.disk_form_advpowermgmt_tooltip,
      options: [],
    },
    {
      type: 'select',
      name: 'disk_acousticlevel',
      placeholder: helptext.disk_form_acousticlevel_placeholder,
      value: this.diskBucket.acousticLevel,
      tooltip : helptext.disk_form_acousticlevel_tooltip,
      options: [],
    },
    {
      type : 'checkbox',
      name : 'disk_togglesmart',
      placeholder : helptext.disk_form_togglesmart_placeholder,
      value: this.diskBucket.diskToggleStatus,
      tooltip : helptext.disk_form_bulk_edit_togglesmart_tooltip,
    },
    {
      type: 'input',
      name: 'disk_smartoptions',
      placeholder: helptext.disk_form_smartoptions_placeholder,
      value: this.diskBucket.SMARToptions,
      tooltip : helptext.disk_form_smartoptions_tooltip,
    }
  ];

  protected disk_hddstandby: any;
  protected disk_advpowermgmt: any;
  protected disk_acousticlevel: any;
  protected entityList: any;

  constructor(
    private _router: Router,
    private dialogService: DialogService,
    protected rest: RestService,
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
      this._router.navigate(new Array('/').concat([
        "storage", "disks"]));
    }

    this.ws.call('notifier.choices', ['HDDSTANDBY_CHOICES']).subscribe((res) => {
      this.disk_hddstandby = _.find(this.fieldConfig, {name : 'disk_hddstandby'});
      res.forEach((item) => {
        this.disk_hddstandby.options.push(
            {label : item[1], value : item[0].toUpperCase()});
      });
    });

    this.ws.call('notifier.choices', ['ADVPOWERMGMT_CHOICES']).subscribe((res) => {
      this.disk_advpowermgmt = _.find(this.fieldConfig, {name : 'disk_advpowermgmt'});
      res.forEach((item) => {
        this.disk_advpowermgmt.options.push(
            {label : item[1], value : item[0].toUpperCase()});
      });
    });

    this.ws.call('notifier.choices', ['ACOUSTICLVL_CHOICES']).subscribe((res) => {
      this.disk_acousticlevel = _.find(this.fieldConfig, {name : 'disk_acousticlevel'});
      res.forEach((item) => {
        this.disk_acousticlevel.options.push(
            {label : item[1], value : item[0].toUpperCase()});
      });
    });
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
            this._router.navigate(new Array('/').concat([
              "storage", "disks"]));          
          }
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error updating disks."), err.reason, err.trace.formatted);
        }
      )
  }

}