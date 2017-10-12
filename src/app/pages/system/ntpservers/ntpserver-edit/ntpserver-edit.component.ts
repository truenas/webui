import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AbstractControl, FormArray, FormGroup, Validators } from '@angular/forms';
import { RestService } from '../../../../services/rest.service';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';

@Component({
  selector: 'app-ntpserver-edit',
  template: `<entity-form [conf]="this"></entity-form>`,
})
export class NTPServerEditComponent {

  protected resource_name: string = 'system/ntpserver/';
  protected route_success: string[] = ['system', 'ntpservers'];
  protected isEntity: boolean = true;

  public fieldConfig: FieldConfig[] = [{
      type: 'input',
      name: 'ntp_address',
      placeholder: 'Address'
    },
    {
      type: 'checkbox',
      name: 'ntp_burst',
      placeholder: 'Burst'
    },
    {
      type: 'checkbox',
      name: 'ntp_iburst',
      placeholder: 'IBurst',
    },
    {
      type: 'checkbox',
      name: 'ntp_prefer',
      placeholder: 'Perfer'
    },
    {
      type: 'input',
      name: 'ntp_minpoll',
      placeholder: 'Min. Poll',
      inputType: 'number',
      validation: [Validators.required, Validators.min(0)]
    },
    {
      type: 'input',
      name: 'ntp_maxpoll',
      placeholder: 'Max. Poll',
      inputType: 'number',
      validation: [Validators.required, Validators.min(0)]
    },
    {
      type: 'checkbox',
      name: 'force',
      placeholder: 'Force'
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
    protected rest: RestService) {}

  afterInit(entityEdit) {}
}
