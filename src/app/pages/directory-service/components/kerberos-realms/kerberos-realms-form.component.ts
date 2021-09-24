import { Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import helptext from 'app/helptext/directory-service/kerberos-realms-form-list';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-group-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class KerberosRealmsFormComponent implements FormConfiguration {
  title: string;
  addCall: 'kerberos.realm.create' = 'kerberos.realm.create';
  editCall: 'kerberos.realm.update' = 'kerberos.realm.update';
  queryCall: 'kerberos.realm.query' = 'kerberos.realm.query';
  pk: any;
  queryKey = 'id';
  isEntity = true;
  private getRow = new Subscription();
  protected isOneColumnForm = true;
  fieldConfig: FieldConfig[] = [];
  fieldSets: FieldSet[] = [
    {
      name: helptext.kerb_form_heading,
      class: 'heading',
      label: false,
      config: [
        {
          type: 'input',
          name: helptext.krbrealm_form_realm_name,
          placeholder: helptext.krbrealm_form_realm_placeholder,
          tooltip: helptext.krbrealm_form_realm_tooltip,
          required: true,
          validation: helptext.krbrealm_form_realm_validation,
        },
        {
          type: 'chip',
          name: helptext.krbrealm_form_kdc_name,
          placeholder: helptext.krbrealm_form_kdc_placeholder,
          tooltip: `${helptext.krbrealm_form_kdc_tooltip} ${helptext.multiple_values}`,
        },
        {
          type: 'chip',
          name: helptext.krbrealm_form_admin_server_name,
          placeholder: helptext.krbrealm_form_admin_server_placeholder,
          tooltip: `${helptext.krbrealm_form_admin_server_tooltip} ${helptext.multiple_values}`,
        },
        {
          type: 'chip',
          name: helptext.krbrealm_form_kpasswd_server_name,
          placeholder: helptext.krbrealm_form_kpasswd_server_placeholder,
          tooltip: `${helptext.krbrealm_form_kpasswd_server_tooltip} ${helptext.multiple_values}`,
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
