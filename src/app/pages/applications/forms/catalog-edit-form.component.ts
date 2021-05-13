import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import * as _ from 'lodash';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { ModalService } from '../../../services/modal.service';
import { DialogService } from '../../../services/index';
import { EntityJobComponent } from '../../common/entity/entity-job/entity-job.component';
import { ApplicationsService } from '../applications.service';
import helptext from '../../../helptext/apps/apps';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FormListComponent } from '../../common/entity/entity-form/components/form-list/form-list.component';
import { EntityUtils } from '../../common/entity/utils';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';

@Component({
  selector: 'app-catalog-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CatalogEditFormComponent implements FormConfiguration {
  queryCall: 'catalog.query' = 'catalog.query';
  editCall: 'catalog.update' = 'catalog.update';
  customFilter: any[];
  isEntity = true;
  isEditJob = false;
  entityForm: EntityFormComponent;
  title = helptext.catalogForm.editTitle;
  fieldSets: FieldSets = new FieldSets([
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
          disabled: true,
        },
        {
          type: 'select',
          multiple: true,
          name: 'preferred_trains',
          placeholder: helptext.catalogForm.preferredTrains.placeholder,
          tooltip: helptext.catalogForm.preferredTrains.tooltip,
          options: [],
        },
      ],
    },
  ]);

  constructor(private mdDialog: MatDialog, private dialogService: DialogService,
    private modalService: ModalService) {
    this.modalService.getRow$.subscribe((label: string) => {
      this.customFilter = [[['id', '=', label]], { extra: { item_details: true } }];
    });
  }

  afterModalFormClosed(): void {
    this.modalService.refreshTable();
  }

  resourceTransformIncomingRestData(d: any): any {
    const data = Object.assign([], d);
    const trains = Object.keys(d.trains);

    const trainOptions = trains.map((train) => ({
      label: train,
      value: train,
    }));
    this.fieldSets.config('preferred_trains').options = trainOptions;
    return data;
  }
}
