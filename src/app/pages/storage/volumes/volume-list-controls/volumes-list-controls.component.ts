import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CoreService } from 'app/core/services/core-service/core.service';
import { GlobalAction } from 'app/interfaces/global-action.interface';
import { EntityTableAction, EntityTableConfig } from 'app/modules/entity/entity-table/entity-table.interface';
import { VolumeImportWizardComponent } from 'app/pages/storage/volumes/volume-import-wizard/volume-import-wizard.component';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';
import { ModalService } from 'app/services/modal.service';

@UntilDestroy()
@Component({
  selector: 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html',
  styleUrls: ['./volumes-list-controls.component.scss'],
})
export class VolumesListControlsComponent implements GlobalAction, OnInit {
  @Input() entity: VolumesListComponent;

  conf: EntityTableConfig;
  actions: EntityTableAction[];

  form = this.fb.group({
    keyword: [''],
  });

  constructor(
    private fb: FormBuilder,
    private core: CoreService,
    private modalService: ModalService,
  ) {}

  ngOnInit(): void {
    this.form.controls.keyword.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: string) => {
        this.filterDatasets(value);
      },
    );
  }

  applyConfig(config: VolumesListComponent): void {
    if (config) {
      this.actions = config.getAddActions();
      this.conf = config.conf;
      this.entity = config;
    } else {
      throw new Error('This component requires an entity class for a config');
    }
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
