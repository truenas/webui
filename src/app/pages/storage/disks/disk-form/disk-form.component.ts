import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/storage/disks/disk-form';


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
      placeholder: helptext.disk_form_name_placeholder,
      tooltip : helptext.disk_form_name_tooltip,
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_serial',
      placeholder: helptext.disk_form_serial_placeholder,
      tooltip : helptext.disk_form_serial_tooltip,
      readonly: true
    },
    {
      type: 'input',
      name: 'disk_description',
      placeholder: helptext.disk_form_description_placeholder,
      tooltip : helptext.disk_form_description_tooltip,
    },
    {
      type: 'select',
      name: 'disk_hddstandby',
      placeholder: helptext.disk_form_hddstandby_placeholder,
      tooltip : helptext.disk_form_hddstandby_tooltip,
      options: [],
    },
    {
      type: 'select',
      name: 'disk_advpowermgmt',
      placeholder: helptext.disk_form_advpowermgmt_placeholder,
      tooltip : helptext.disk_form_advpowermgmt_tooltip,
      options: [],
    },
    {
      type: 'select',
      name: 'disk_acousticlevel',
      placeholder: helptext.disk_form_acousticlevel_placeholder,
      tooltip : helptext.disk_form_acousticlevel_tooltip,
      options: [],
    },
    {
      type : 'checkbox',
      name : 'disk_togglesmart',
      placeholder : helptext.disk_form_togglesmart_placeholder,
      tooltip : helptext.disk_form_togglesmart_tooltip
    },
    {
      type: 'input',
      name: 'disk_smartoptions',
      placeholder: helptext.disk_form_smartoptions_placeholder,
      tooltip : helptext.disk_form_smartoptions_tooltip
    },
    {
      type: 'input',
      name: 'disk_passwd',
      placeholder: helptext.disk_form_passwd_placeholder,
      tooltip: helptext.disk_form_passwd_tooltip,
      inputType: 'password',
      value: '',
      togglePw: true
    },
    {
      type: 'input',
      name: 'disk_passwd2',
      placeholder: helptext.disk_form_passwd2_placeholder,
      tooltip: helptext.disk_form_passwd2_tooltip,
      inputType: 'password',
      value: '',
      validation : helptext.disk_form_passwd2_validation
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
