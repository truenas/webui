import { Component, Input } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CoreService } from 'app/core/services/core-service/core.service';
import { GlobalAction } from 'app/interfaces/global-action.interface';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { EntityTableAction, EntityTableConfig } from 'app/pages/common/entity/entity-table/entity-table.interface';
import { VolumeImportWizardComponent } from 'app/pages/storage/volumes/volume-import-wizard/volume-import-wizard.component';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html',
  styleUrls: ['./volumes-list-controls.component.scss'],
  providers: [MessageService],
})
export class VolumesListControlsComponent implements GlobalAction {
  @Input() entity: VolumesListComponent;

  conf: EntityTableConfig;
  filterValue = '';
  actions: EntityTableAction[];

  get totalActions(): number {
    const addAction = this.entity.conf.route_add ? 1 : 0;
    return this.actions.length + addAction;
  }

  form = this.fb.group({
    keyword: [''],
  });

  constructor(
    private fb: FormBuilder,
    private core: CoreService,
    private modalService: ModalService,
  ) {}

  applyConfig(config: VolumesListComponent): void {
    if (config) {
      this.actions = config.getAddActions();
      this.conf = config.conf;
      this.entity = config;
    } else {
      throw new Error('This component requires an entity class for a config');
    }
  }

  onChange(value: string): void {
    this.filterDatasets(value);
  }

  filterDatasets(value: string): void {
    this.core.emit({
      name: 'TreeTableGlobalFilter',
      data: { column: 'name', value },
      sender: this,
    });
  }

  onClickImport(): void {
    this.modalService.openInSlideIn(VolumeImportWizardComponent);
  }
}
