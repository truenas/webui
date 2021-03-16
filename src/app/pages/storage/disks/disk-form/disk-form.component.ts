import { Component } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators } from '@angular/forms';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../../common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../../helptext/storage/disks/disks';

@Component({
  selector : 'app-disk-form',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class DiskFormComponent {

  protected route_success: string[] = ['storage', 'disks'];
  protected queryCall = 'disk.query';
  protected editCall = 'disk.update';
  protected customFilter: Array<any> = [[["identifier", "="]]];
  protected isEntity = true;

  protected fieldConfig: FieldConfig[];
  public fieldSets: FieldSet[] = [
    {
      name: helptext.fieldset_disk,
      label: true,
      class: 'general',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'name',
          placeholder: helptext.disk_form_name_placeholder,
          tooltip: helptext.disk_form_name_tooltip,
          readonly: true,
        },
        {
          type: 'input',
          name: 'serial',
          placeholder: helptext.disk_form_serial_placeholder,
          tooltip: helptext.disk_form_serial_tooltip,
          readonly: true,
        },
        {
          type: 'input',
          name: 'description',
          placeholder: helptext.disk_form_description_placeholder,
          tooltip: helptext.disk_form_description_tooltip,
        },
      ],
    },
    {
      name: helptext.fieldset_temperature,
      label: true,
      class: 'general',
      width: '100%',
      config: [
        {
          type: 'input',
          inputType: 'number',
          name: 'critical',
          placeholder: helptext.disk_form_critical_placeholder,
          tooltip: helptext.disk_form_critical_tooltip,
          min: 0,
          validation: [Validators.min(0)],
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'difference',
          placeholder: helptext.disk_form_difference_placeholder,
          tooltip: helptext.disk_form_difference_tooltip,
          min: 0,
          validation: [Validators.min(0)],
        },
        {
          type: 'input',
          inputType: 'number',
          name: 'informational',
          placeholder: helptext.disk_form_informational_placeholder,
          tooltip: helptext.disk_form_informational_tooltip,
          min: 0,
          validation: [Validators.min(0)],
        },
      ],
    },
    { name: 'divider', divider: true },
    {
      name: helptext.fieldset_powermgmt,
      label: true,
      class: 'general',
      width: '100%',
      config: [
        {
          type: 'select',
          name: 'hddstandby',
          placeholder: helptext.disk_form_hddstandby_placeholder,
          tooltip: helptext.disk_form_hddstandby_tooltip,
          options: helptext.disk_form_hddstandby_options,
        },
        {
          type: 'checkbox',
          name: 'hddstandby_force',
          placeholder: helptext.force_hdd_standby.placeholder,
          tooltip: helptext.force_hdd_standby.tooltip,
          relation: [
            {
              action: 'DISABLE',
              when: [
                {
                  name: 'hddstandby',
                  value: 'ALWAYS ON',
                },
              ],
            },
          ],
        },
        {
          type: 'select',
          name: 'advpowermgmt',
          placeholder: helptext.disk_form_advpowermgmt_placeholder,
          tooltip: helptext.disk_form_advpowermgmt_tooltip,
          options: helptext.disk_form_advpowermgmt_options,
        },
        {
          type: 'select',
          name: 'acousticlevel',
          placeholder: helptext.disk_form_acousticlevel_placeholder,
          tooltip: helptext.disk_form_acousticlevel_tooltip,
          options: helptext.disk_form_acousticlevel_options,
        },
      ],
    },
    {
      name: helptext.fieldset_smartsed,
      label: true,
      class: 'general',
      width: '100%',
      config: [
        {
          type: 'checkbox',
          name: 'togglesmart',
          placeholder: helptext.disk_form_togglesmart_placeholder,
          tooltip: helptext.disk_form_togglesmart_tooltip,
        },
        {
          type: 'input',
          name: 'smartoptions',
          placeholder: helptext.disk_form_smartoptions_placeholder,
          tooltip: helptext.disk_form_smartoptions_tooltip,
        },
        {
          type: 'input',
          name: 'passwd',
          placeholder: helptext.disk_form_passwd_placeholder,
          tooltip: helptext.disk_form_passwd_tooltip,
          inputType: 'password',
          value: '',
          togglePw: true,
          relation: [
            {
              action: 'DISABLE',
              when: [
                {
                  name: 'clear_pw',
                  value: true,
                },
              ],
            },
          ],
        },
        {
          type: 'checkbox',
          name: 'clear_pw',
          placeholder: helptext.clear_pw.placeholder,
          tooltip: helptext.clear_pw.tooltip,
        },
      ],
    },
    { name: 'divider', divider: true },
  ]

  protected disk_hddstandby: any;
  protected disk_advpowermgmt: any;
  protected disk_acousticlevel: any;
  protected title: String;
  
  public rowid: any;

  constructor(
    private _router: Router,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected aroute: ActivatedRoute
  ) {
  }

  resourceTransformIncomingRestData(data) {
    delete data.passwd;
    return data;
  }


  preInit() {
    this.aroute.params.subscribe(params => {
      /* 
       * Make sure the route is "storage/disks" before
       * using the pk value 
       * */
      if (params['pk'] && this._router.url.startsWith("/storage/disks")){
        this.customFilter[0][0].push(params['pk']);
      }
    });
  }

  afterInit(entityEdit: any) {
    entityEdit.formGroup.controls['hddstandby'].valueChanges.subscribe(value => {
      if (value === 'ALWAYS ON') {
        entityEdit.formGroup.controls['hddstandby_force'].setValue(false);
      }
    })
  }

  beforeSubmit(value) {
    if (!value.hddstandby_force) {
      value.hddstandby_force = false;
    }
    if (value.passwd === '') {
      delete value.passwd;
    }

    if (value.clear_pw) {
      value.passwd= '';
    }

    delete value.clear_pw;
    delete value.name;
    delete value.serial;

    value.critical = value.critical === '' ? null : value.critical;
    value.difference = value.difference === '' ? null : value.difference;
    value.informational = value.informational === '' ? null : value.informational;
  }

  inIt(pk) {
    this.title = helptext.disk_form_title;

    delete this.route_success;

    if (pk) {
      this.rowid = pk;
      this.customFilter[0][0].push(pk);
    }
  }
}
