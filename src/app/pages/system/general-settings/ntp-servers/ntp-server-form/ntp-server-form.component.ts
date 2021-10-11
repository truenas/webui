import { Component } from '@angular/core';
import { Validators } from '@angular/forms';
import { helptext_system_ntpservers as helptext } from 'app/helptext/system/ntp-servers';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ValidationService } from 'app/services';
import { ModalService } from 'app/services/modal.service';

@Component({
  selector: 'app-ntpserver-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class NtpServerFormComponent implements FormConfiguration {
  addCall = 'system.ntpserver.create' as const;
  editCall = 'system.ntpserver.update' as const;
  queryCall = 'system.ntpserver.query' as const;
  isEntity = true;
  title = helptext.header;
  protected isOneColumnForm = true;

  queryKey = 'id';
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.header,
      class: 'ntp',
      label: false,
      config: [
        {
          type: 'input',
          name: 'address',
          placeholder: helptext.add.address.placeholder,
          tooltip: helptext.add.address.tooltip,
        },
        {
          type: 'checkbox',
          name: 'burst',
          placeholder: helptext.add.burst.placeholder,
          tooltip: helptext.add.burst.tooltip,
        },
        {
          type: 'checkbox',
          name: 'iburst',
          placeholder: helptext.add.iburst.placeholder,
          tooltip: helptext.add.iburst.tooltip,
          value: true,
        },
        {
          type: 'checkbox',
          name: 'prefer',
          placeholder: helptext.add.prefer.placeholder,
          tooltip: helptext.add.prefer.tooltip,
        },
        {
          type: 'input',
          name: 'minpoll',
          placeholder: helptext.add.minpoll.placeholder,
          tooltip: helptext.add.minpoll.tooltip,
          value: 6,
          validation: helptext.add.minpoll.validation,
        },
        {
          type: 'input',
          name: 'maxpoll',
          placeholder: helptext.add.maxpoll.placeholder,
          tooltip: helptext.add.maxpoll.tooltip,
          value: 10,
          validation: [
            Validators.max(17),
            this.validationService.greaterThan('minpoll', [helptext.add.minpoll.placeholder]),
            Validators.required,
          ],
        },
        {
          type: 'checkbox',
          name: 'force',
          placeholder: helptext.add.force.placeholder,
          tooltip: helptext.add.force.tooltip,
        },
      ],
    },
  ];

  constructor(
    private modalService: ModalService,
    private validationService: ValidationService,
  ) {}

  afterSubmit(): void {
    this.modalService.refreshTable();
  }
}
