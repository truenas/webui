import { Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import helptext from 'app/helptext/apps/apps';
import { Catalog, CatalogQueryParams } from 'app/interfaces/catalog.interface';
import { FormConfiguration } from 'app/interfaces/entity-form.interface';
import { EntityFormComponent } from 'app/pages/common/entity/entity-form';
import { FieldSets } from 'app/pages/common/entity/entity-form/classes/field-sets';
import { FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { DialogService } from 'app/services/index';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-catalog-form',
  template: '<entity-form [conf]="this"></entity-form>',
})
export class CatalogEditFormComponent implements FormConfiguration {
  queryCall: 'catalog.query' = 'catalog.query';
  editCall: 'catalog.update' = 'catalog.update';
  customFilter: CatalogQueryParams;
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
    this.modalService.getRow$.pipe(untilDestroyed(this)).subscribe((label: string) => {
      this.customFilter = [[['id', '=', label]], { extra: { item_details: true } }];
    });
  }

  afterModalFormClosed(): void {
    this.modalService.refreshTable();
  }

  resourceTransformIncomingRestData(data: Catalog): Catalog {
    const transformed = { ...data };
    const trains = Object.keys(data.trains);

    const trainOptions = trains.map((train) => ({
      label: train,
      value: train,
    }));
    const config: FormSelectConfig = this.fieldSets.config('preferred_trains');
    config.options = trainOptions;
    return transformed;
  }
}
