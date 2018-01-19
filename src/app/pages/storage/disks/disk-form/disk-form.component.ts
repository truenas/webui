import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';


@Component({
  selector : 'app-disk-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DiskFormComponent {

  protected route_success: string[] = ['storage', 'disks'];
  protected resource_name: string = 'storage/disk/';
  protected isEntity: boolean = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'disk_name',
      placeholder: 'Name',
      tooltip : 'Read-only value showing FreeBSD device name for disk.',
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_serial',
      placeholder: 'Serial',
      tooltip : 'Read-only value showing the serial numeber of the\
 disk.',
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_description',
      placeholder: 'Description',
      tooltip : 'Optional.',
    },
    {
      type: 'select',
      name: 'disk_hddstandby',
      placeholder: 'HDD Standby',
      tooltip : 'Indicates the time of inactivity (in minutes) before\
 the drive enters standby mode in order to conserve energy. This <a\
 href="https://forums.freenas.org/index.php?threads/how-to-find-out-if-a-drive-is-spinning-down-properly.2068/"\
 target="_blank">forum post</a> demonstrates how to determine\
 if a drive has spun down.',
      options: [],
    },
    {
      type: 'select',
      name: 'disk_advpowermgmt',
      placeholder: 'Advanced Power Management',
      tooltip : 'Default is <i>Disabled</i>. Can select a power\
 management profile from the menu.',
      options: [],
    },
    {
      type: 'select',
      name: 'disk_acousticlevel',
      placeholder: 'Acoustic Level',
      tooltip : 'Default is <i>Disabled</i>. Can be modified for disks\
 that understand\
 <a href="https://en.wikipedia.org/wiki/Automatic_acoustic_management"\
 target="_blank">AAM</a>.',
      options: [],
    },
    {
      type : 'checkbox',
      name : 'disk_togglesmart',
      placeholder : 'Enable S.M.A.R.T.',
      tooltip : 'Enabled by default if the disk supports S.M.A.R.T.\
 Unchecking this box will diable any configured\
 <a href="http://doc.freenas.org/11/tasks.html#s-m-a-r-t-tests"\
 target="_blank">S.M.A.R.T. Tests</a> for the disk.',
    },
    {
      type: 'input',
      name: 'disk_smartoptions',
      placeholder: 'S.M.A.R.T. extra options',
      tooltip : 'Additional <a\
 href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
 target="_blank">smartctl(8)</a> options.',
    }
  ];

  protected disk_hddstandby: any;
  protected disk_advpowermgmt: any;
  protected disk_acousticlevel: any;

  constructor(
    private _router: Router,
    protected rest: RestService,
    protected ws: WebSocketService
  ) {}

  afterInit(entityEdit: any) {
    this.ws.call('notifier.choices', ['HDDSTANDBY_CHOICES']).subscribe((res) => {
      this.disk_hddstandby = _.find(this.fieldConfig, {name : 'disk_hddstandby'});
      res.forEach((item) => {
        this.disk_hddstandby.options.push(
            {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['ADVPOWERMGMT_CHOICES']).subscribe((res) => {
      this.disk_advpowermgmt = _.find(this.fieldConfig, {name : 'disk_advpowermgmt'});
      res.forEach((item) => {
        this.disk_advpowermgmt.options.push(
            {label : item[1], value : item[0]});
      });
    });

    this.ws.call('notifier.choices', ['ACOUSTICLVL_CHOICES']).subscribe((res) => {
      this.disk_acousticlevel = _.find(this.fieldConfig, {name : 'disk_acousticlevel'});
      res.forEach((item) => {
        this.disk_acousticlevel.options.push(
            {label : item[1], value : item[0]});
      });
    });
  }
}
