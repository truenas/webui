import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
<<<<<<< HEAD
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
=======
import { FormControl } from '@angular/forms';
import * as _ from 'lodash';

import { RestService, WebSocketService } from '../../../../services/';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
>>>>>>> master
import helptext from '../../../../helptext/services/components/service-lldp';
import { RestService, WebSocketService } from '../../../../services/';

@Component({
  selector : 'lldp-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ServiceLLDPComponent {
  protected queryCall = 'lldp.config';
  protected route_success: string[] = [ 'services' ];

<<<<<<< HEAD
  public fieldSets: FieldSet[] = [
=======
  public fieldConfig: FieldConfig[] = [
    {
      type : 'checkbox',
      name : 'lldp_intdesc',
      placeholder : helptext.lldp_intdesc_placeholder,
      tooltip: helptext.lldp_intdesc_tooltip,
    },
    {
      type : 'input',
      name : 'lldp_country',
      placeholder : helptext.lldp_country_placeholder,
      tooltip: helptext.lldp_country_tooltip,
      validation: [this.countryValidator('lldp_country')],
    },
>>>>>>> master
    {
      name: helptext.lldp_fieldset_general,
      label: true,
      config: [
        {
          type : 'checkbox',
          name : 'intdesc',
          placeholder : helptext.lldp_intdesc_placeholder,
          tooltip: helptext.lldp_intdesc_tooltip,
        },
        {
          type : 'input',
          name : 'country',
          placeholder : helptext.lldp_country_placeholder,
          tooltip: helptext.lldp_country_tooltip,
        },
        {
          type : 'input',
          name : 'location',
          placeholder : helptext.lldp_location_placeholder,
          tooltip: helptext.lldp_location_tooltip
        }
      ]
    }
  ];

  constructor(protected router: Router, protected route: ActivatedRoute,
              protected rest: RestService, protected ws: WebSocketService,
              protected _injector: Injector, protected _appRef: ApplicationRef,
              ) {}

<<<<<<< HEAD
  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => this.ws.call('lldp.update', [body]) 
  }
=======
  afterInit(entityEdit: any) { }

  countryValidator(code: string) {
    const self = this;
    return function validCode(control: FormControl) {
      const config = self.fieldConfig.find(c => c.name === code);
      if (control.value || control.value === '') {
        const errors = (!(control.value).match(/^[A-Z,a-z]{2}$/) && !(control.value === ''))
        ? { validCode : true }
        : null;

        if (errors) {
          config.hasErrors = true;
          config.warnings = helptext.lldp_country_validation_error;
        } else {
          config.hasErrors = false;
          config.warnings = '';
        }
        return errors;
      }
    }
  };
>>>>>>> master
}
