import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { FieldConfig } from '../../common/entity/entity-form/models/field-config.interface';
import { FieldSet } from '../../common/entity/entity-form/models/fieldset.interface';
import { ModalService } from '../../../services/modal.service';
import { DialogService } from '../../../services/index';
import helptext from '../../../helptext/apps/apps';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';

@Component({
  selector: 'app-catalog-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CatalogAddFormComponent {
  protected queryCall = 'catalog.query';
  protected customFilter: any[];
  protected addCall = 'catalog.create';
  protected isEntity = true;
  protected entityForm: EntityFormComponent;
  private title = helptext.catalogForm.title;
  private dialogRef: any;
  protected fieldConfig: FieldConfig[];
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
        },
        {
          type: 'input',
          name: 'branch',
          placeholder: helptext.catalogForm.branch.placeholder,
          tooltip: helptext.catalogForm.branch.tooltip,
          value: 'master',
        },
      ],
    },
  ];

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
  }

  afterModalFormClosed() {
    this.modalService.refreshTable();
  }
}
