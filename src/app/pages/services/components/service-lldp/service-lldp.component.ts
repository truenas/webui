import { ApplicationRef, Component, Injector } from '@angular/core';
import { FormControl, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/services/components/service-lldp';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig, FormComboboxConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { WebSocketService, ServicesService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'lldp-edit',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class ServiceLLDPComponent implements FormConfiguration {
  queryCall = 'lldp.config' as const;
  routeSuccess: string[] = ['services'];
  title = helptext.formTitle;

  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.lldp_fieldset_general,
      label: true,
      config: [
        {
          type: 'checkbox',
          name: 'intdesc',
          placeholder: helptext.lldp_intdesc_placeholder,
          tooltip: helptext.lldp_intdesc_tooltip,
        },
        {
          type: 'combobox',
          name: 'country',
          placeholder: helptext.lldp_country_placeholder,
          tooltip: helptext.lldp_country_tooltip,
          options: [],
          validation: [Validators.required, this.countryValidator('country')],
          required: true,
        },
        {
          type: 'input',
          name: 'location',
          placeholder: helptext.lldp_location_placeholder,
          tooltip: helptext.lldp_location_tooltip,
        },
      ],
    },
  ];

  constructor(
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected _injector: Injector,
    protected _appRef: ApplicationRef,
    protected services: ServicesService,
  ) {}

  afterInit(entityEdit: EntityFormComponent): void {
    entityEdit.submitFunction = (body) => this.ws.call('lldp.update', [body]);

    this.services.getLldpCountries().pipe(untilDestroyed(this)).subscribe((res) => {
      const countries = this.fieldSets
        .find((set) => set.name === 'General Options')
        .config.find((config) => config.name === 'country') as FormComboboxConfig;
      for (const country in res) {
        countries.options.push({ label: `${country} (${res[country]})`, value: `${country}` });
      }
    });
  }

  countryValidator(code: string): ValidatorFn {
    return (control: FormControl) => {
      const config = this.fieldConfig.find((c) => c.name === code);
      if (control.value || control.value === '') {
        const errors = (!(control.value).match(/^[A-Z]{2}$/) && !(control.value === ''))
          ? { validCode: true }
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
    };
  }
}
