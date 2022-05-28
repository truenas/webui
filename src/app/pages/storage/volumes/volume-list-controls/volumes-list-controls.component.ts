import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EntityTableAction } from 'app/modules/entity/entity-table/entity-table.interface';
import { VolumeImportWizardComponent } from 'app/pages/storage/volumes/volume-import-wizard/volume-import-wizard.component';
import { VolumesListTableConfig } from 'app/pages/storage/volumes/volumes-list/volumes-list-table-config';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html',
  styleUrls: ['./volumes-list-controls.component.scss'],
})
export class VolumesListControlsComponent implements OnInit {
  @Input() entity: VolumesListComponent;
  @Input() conf: VolumesListTableConfig;

  actions: EntityTableAction[];

  form = this.fb.group({
    keyword: [''],
  });

  constructor(
    private fb: FormBuilder,
    private core: CoreService,
    private slideInService: IxSlideInService,
  ) {}

  ngOnInit(): void {
    this.form.controls.keyword.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: string) => {
        this.filterDatasets(value);
      },
    );
  }

  filterDatasets(value: string): void {
    this.core.emit({
      name: 'TreeTableGlobalFilter',
      data: { column: 'name', value },
      sender: this,
    });
  }

  onClickImport(): void {
    this.slideInService.open(VolumeImportWizardComponent);
  }
}
