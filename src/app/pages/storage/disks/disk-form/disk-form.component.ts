import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/storage/disks/disks';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { RelationAction } from 'app/pages/common/entity/entity-form/models/relation-action.enum';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-disk-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class DiskFormComponent implements FormConfiguration {
  route_success: string[] = ['storage', 'disks'];
  queryCall = 'disk.query' as const;
  editCall = 'disk.update' as const;
  customFilter: any[] = [[['identifier', '=']]];
  isEntity = true;

  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
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
          type: 'select',
          name: 'advpowermgmt',
          placeholder: helptext.disk_form_advpowermgmt_placeholder,
          tooltip: helptext.disk_form_advpowermgmt_tooltip,
          options: helptext.disk_form_advpowermgmt_options,
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
              action: RelationAction.Disable,
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
  ];

  title: string;

  rowid: string;

  constructor(
    private _router: Router,
    protected ws: WebSocketService,
    protected aroute: ActivatedRoute,
  ) {
  }

  resourceTransformIncomingRestData(data: Disk): Disk {
    const transformed = { ...data };
    delete transformed.passwd;
    return transformed;
  }

  preInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      /*
       * Make sure the route is "storage/disks" before
       * using the pk value
       * */
      if (params['pk'] && this._router.url.startsWith('/storage/disks')) {
        this.customFilter[0][0].push(params['pk']);
      }
    });
  }

  beforeSubmit(value: any): void {
    if (value.passwd === '') {
      delete value.passwd;
    }

    if (value.clear_pw) {
      value.passwd = '';
    }

    delete value.clear_pw;
    delete value.name;
    delete value.serial;

    value.critical = value.critical === '' ? null : value.critical;
    value.difference = value.difference === '' ? null : value.difference;
    value.informational = value.informational === '' ? null : value.informational;
  }

  inIt(pk: string): void {
    this.title = helptext.disk_form_title;

    delete this.route_success;

    if (pk) {
      this.rowid = pk;
      this.customFilter[0][0].push(pk);
    }
  }
}
