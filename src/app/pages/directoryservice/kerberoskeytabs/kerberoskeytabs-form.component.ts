import { Component } from '@angular/core';
import * as _ from 'lodash';

import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import helptext from '../../../helptext/directoryservice/kerberoskeytabs-form-list';
import { Subscription } from 'rxjs';
import { ModalService } from '../../../services/modal.service';
@Component({
  selector: 'app-kerberos-keytbas-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class KerberosKeytabsFormComponent {
  protected title: string;
  protected addCall = 'kerberos.keytab.create';
  protected editCall = 'kerberos.keytab.update';
  protected queryCall = 'kerberos.keytab.query';
  protected pk: any;
  protected queryKey = 'id';
  protected isEntity = true;
  private getRow = new Subscription();
  protected isOneColumnForm = true;
  protected fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.kkt_heading,
      class: 'heading',
      label: false,
      config: [
        {
          type: 'input',
          name: helptext.kkt_ktname_name,
          placeholder: helptext.kkt_ktname_placeholder,
          tooltip: helptext.kkt_ktname_tooltip,
          required: true,
          validation: helptext.kkt_ktname_validation,
        },
        {
          type: 'input',
          inputType: 'file',
          name: helptext.kkt_ktfile_name,
          placeholder: helptext.kkt_ktfile_placeholder,
          tooltip: helptext.kkt_ktfile_tooltip,
          fileType: 'binary',
          required: true,
          validation: helptext.kkt_ktfile_validation,
        },
      ],
    },
  ];

  constructor(private modalService: ModalService) {
    this.getRow = this.modalService.getRow$.subscribe((rowId) => {
      this.pk = rowId;
      this.getRow.unsubscribe();
    });
  }

  afterInit(entityEdit: any) {
    this.title = entityEdit.isNew ? helptext.title_add : helptext.title_edit;
  }

  afterSubmit() {
    this.modalService.refreshTable();
  }
}
