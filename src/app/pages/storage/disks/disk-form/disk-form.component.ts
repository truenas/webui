import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { T } from '../../../../translate-marker';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';

@Component({
  selector : 'app-disk-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DiskFormComponent {

  protected route_success: string[] = ['storage', 'disks'];
  protected resource_name: string = 'storage/disk/';
  protected isEntity = true;

  protected fieldConfig: FieldConfig[] = [
    {
      type: 'input',
      name: 'disk_name',
      placeholder: T('Name'),
      tooltip : T('This is the FreeBSD device name for the disk.'),
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_serial',
      placeholder: T('Serial'),
      tooltip : T('This is the serial number of the disk.'),
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_description',
      placeholder: T('Description'),
      tooltip : T('Enter any notes about this disk.'),
    },
    {
      type: 'select',
      name: 'disk_hddstandby',
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
      tooltip : T('Select a power management profile from the menu.'),
      options: [],
    },
    {
      type: 'select',
      name: 'disk_acousticlevel',
      placeholder: T('Acoustic Level'),
      tooltip : T('Modify for disks that understand <a\
                   href="https://en.wikipedia.org/wiki/Automatic_acoustic_management"\
                   target="_blank">AAM</a>.'),
      options: [],
    },
    {
      type : 'checkbox',
      name : 'disk_togglesmart',
      placeholder : T('Enable S.M.A.R.T.'),
      tooltip : T('Set by default if the disk supports S.M.A.R.T.\
                   Unset to disable any configured <a\
                   href="..//docs/tasks.html#s-m-a-r-t-tests"\
                   target="_blank">S.M.A.R.T. tests</a>.'),
    },
    {
      type: 'input',
      name: 'disk_smartoptions',
      placeholder: T('S.M.A.R.T. extra options'),
      tooltip : T('Additional <a\
                   href="https://www.smartmontools.org/browser/trunk/smartmontools/smartctl.8.in"\
                   target="_blank">smartctl(8)</a> options.'),
    },
    {
      type: 'input',
      name: 'disk_passwd',
      placeholder: T('SED Password'),
      tooltip: T('Password for SED'),
      inputType: 'password',

    },
    {
      type: 'input',
      name: 'disk_passwd2',
      placeholder: T('Confirm SED Password'),
      tooltip: T(''),
      inputType: 'password',
      validation : [ matchOtherValidator('disk_passwd') ],

    },
  ];

  protected disk_hddstandby: any;
  protected disk_advpowermgmt: any;
  protected disk_acousticlevel: any;

  constructor(
    private _router: Router,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected aroute: ActivatedRoute
  ) {
    this.aroute.params.subscribe((params)=> {
      if (params['poolId']) {
        this.route_success = ["storage", "pools", "status", params['poolId']];
      }
    })
  }

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
