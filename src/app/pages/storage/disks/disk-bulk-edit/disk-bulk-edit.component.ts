import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import { AppLoaderService } from '../../../../services/app-loader/app-loader.service';
import { DialogService } from '../../../../services/dialog.service';
import { StorageService } from '../../../../services/storage.service'

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
      placeholder: T('Editing the following disks:'),
      tooltip : T('This is the FreeBSD device name for the disk.'),
      value: [this.diskBucket.diskNames],
      readonly: true
    },    {
      type: 'input',
      name: 'disk_serial',
      placeholder: T('Serial'),
      tooltip : T('This is the serial number of the disk.'),
      value: [this.diskBucket.ids],
      readonly: true,
      isHidden: true
    },
    {
      type: 'select',
      name: 'disk_hddstandby',
      value: this.diskBucket.hddStandby,
      placeholder: T('HDD Standby'),
      tooltip : T('Indicates the time of inactivity in minutes before\
                   the drive enters standby mode. This <a\
                   href="https://forums.freenas.org/index.php?threads/how-to-find-out-if-a-drive-is-spinning-down-properly.2068/"\
                   target="_blank">forum post</a> demonstrates how to\
                   determine if a drive has spun down.'),
      options: [],
    },
    {
      type: 'select',
      name: 'disk_advpowermgmt',
      placeholder: T('Advanced Power Management'),
      value: this.diskBucket.advPowerMgt,
      tooltip : T('Select a power management profile from the menu.'),
      options: [],
    },
    {
      type: 'select',
      name: 'disk_acousticlevel',
      placeholder: T('Acoustic Level'),
      value: this.diskBucket.acousticLevel,
      tooltip : T('Modify for disks that understand <a\
                   href="https://en.wikipedia.org/wiki/Automatic_acoustic_management"\
                   target="_blank">AAM</a>.'),
      options: [],
    },
    {
      type : 'checkbox',
      name : 'disk_togglesmart',
      placeholder : T('Enable S.M.A.R.T.'),
      value: this.diskBucket.diskToggleStatus,
      tooltip : T('Set by default if the disk supports S.M.A.R.T.\
                   Unset to disable any configured <a\
                   href="%%docurl%%/tasks.html#s-m-a-r-t-tests"\
                   target="_blank">S.M.A.R.T. tests</a>.'),
    },
    {
      type: 'input',
      name: 'disk_smartoptions',
      placeholder: T('S.M.A.R.T. extra options'),
      value: this.diskBucket.SMARToptions,
      tooltip : T('Additional <a\
                   href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
                   target="_blank">smartctl(8)</a> options.'),
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
            let success_state = true;
            for (let i = 0; i < res.result.length; i++) {
              if (res.result[i].error != null) {
                this.dialogService.errorReport(T("Error updating disks."), res.result[i].error);
                success_state = false;
                break;
              }
            }
            if (success_state) {
              this._router.navigate(new Array('/').concat(["storage", "disks"]));
            }
          }
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error updating disks."), err.reason, err.trace.formatted);
        }
      )
  }

}
