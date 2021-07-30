import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import helptext from 'app/helptext/directory-service/kerberos-keytabs-form-list';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-kerberos-keytbas-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class KerberosKeytabsFormComponent implements FormConfiguration {
  title: string;
  addCall: 'kerberos.keytab.create' = 'kerberos.keytab.create';
  editCall: 'kerberos.keytab.update' = 'kerberos.keytab.update';
  queryCall: 'kerberos.keytab.query' = 'kerberos.keytab.query';
  pk: any;
  queryKey = 'id';
  isEntity = true;
  private getRow = new Subscription();
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[] = [];
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
    this.getRow = this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((rowId) => {
      this.pk = rowId;
      this.getRow.unsubscribe();
    });
  }

  afterInit(entityEdit: EntityFormComponent): void {
    this.title = entityEdit.isNew ? helptext.title_add : helptext.title_edit;
  }

  afterSubmit(): void {
    this.modalService.refreshTable();
  }
}
