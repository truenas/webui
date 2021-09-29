import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { chartsTrain } from 'app/constants/catalog.constants';
import helptext from 'app/helptext/apps/apps';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form/entity-form.component';
import { FieldConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { FieldSet } from 'app/pages/common/entity/entity-form/models/fieldset.interface';
import { DialogService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';

@Component({
  selector: 'app-catalog-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CatalogAddFormComponent implements FormConfiguration {
  queryCall: 'catalog.query' = 'catalog.query';
  addCall: 'catalog.create' = 'catalog.create';
  isCreateJob = true;
  isEntity = true;
  protected entityForm: EntityFormComponent;
  title = helptext.catalogForm.title;
  fieldConfig: FieldConfig[];
  fieldSets: FieldSet[] = [
    {
      name: 'Name',
      width: '100%',
      config: [
        {
          type: 'input',
          name: 'label',
          placeholder: helptext.catalogForm.name.placeholder,
          tooltip: helptext.catalogForm.name.tooltip,
          required: true,
        },
        {
          type: 'checkbox',
          name: 'force',
          placeholder: helptext.catalogForm.forceCreate.placeholder,
          tooltip: helptext.catalogForm.forceCreate.tooltip,
          value: false,
        },
        {
          type: 'input',
          name: 'repository',
          placeholder: helptext.catalogForm.repository.placeholder,
          tooltip: helptext.catalogForm.repository.tooltip,
          required: true,
        },
        {
          type: 'chip',
          name: 'preferred_trains',
          placeholder: helptext.catalogForm.preferredTrains.placeholder,
          tooltip: helptext.catalogForm.preferredTrains.tooltip,
          value: [chartsTrain],
        },
        {
          type: 'input',
          name: 'branch',
          placeholder: helptext.catalogForm.branch.placeholder,
          tooltip: helptext.catalogForm.branch.tooltip,
          value: 'main',
        },
      ],
    },
  ];

  constructor(
    private mdDialog: MatDialog,
    private dialogService: DialogService,
    private modalService: ModalService,
  ) {}

  afterModalFormClosed(): void {
    this.dialogService.info(helptext.catalogForm.dialog.title, helptext.catalogForm.dialog.message, '500px', 'info', true);
    this.modalService.refreshTable();
  }
}
