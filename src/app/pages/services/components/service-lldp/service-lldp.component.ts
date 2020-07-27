import { ApplicationRef, Component, Injector } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { FormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';

import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import helptext from '../../../../helptext/services/components/service-lldp';
import { RestService, WebSocketService, ServicesService } from '../../../../services/';

@Component({
  selector : 'lldp-edit',
  template : `<entity-form [conf]="this"></entity-form>`
})
export class ServiceLLDPComponent {
  protected queryCall = 'lldp.config';
  protected route_success: string[] = [ 'services' ];
  public title = helptext.formTitle;

  public fieldConfig: FieldConfig[] = [];
  public fieldSets: FieldSet[] = [
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
          type : 'combobox',
          name : 'country',
          placeholder : helptext.lldp_country_placeholder,
          tooltip: helptext.lldp_country_tooltip,
          options: [],
          validation: [Validators.required, this.countryValidator('country')],
          required: true
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
              protected services: ServicesService
              ) {}

  afterInit(entityEdit: EntityFormComponent) {
    entityEdit.submitFunction = body => this.ws.call('lldp.update', [body]);

    this.services.getLLDPCountries().subscribe(res => {

      const countries = this.fieldSets
      .find(set => set.name === 'General Options')
      .config.find(config => config.name === "country");
      for (let country in res) {
        countries.options.push({ label: `${country} (${res[country]})`, value: `${country}` });
      }
    })
  }

  countryValidator(code: string) {
    const self = this;
    return function validCode(control: FormControl) {
      const config = self.fieldConfig.find(c => c.name === code);
      if (control.value || control.value === '') {
        const errors = (!(control.value).match(/^[A-Z]{2}$/) && !(control.value === ''))
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
}
