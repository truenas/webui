import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { fromEvent as observableFromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
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
  providers: [MessageService],
})
export class VolumesListControlsComponent implements GlobalAction, AfterViewInit, OnDestroy {
  @ViewChild('filter', { static: false }) filter: ElementRef;
  @Input() entity: VolumesListComponent;

  conf: EntityTableConfig;
  filterValue = '';
  actions: EntityTableAction[];

  private filterSubscription: Subscription;

  get totalActions(): number {
    const addAction = this.entity.conf.route_add ? 1 : 0;
    return this.actions.length + addAction;
  }

  constructor(
    private core: CoreService,
    private modalService: ModalService,
  ) {}

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
  }

  ngAfterViewInit(): void {
    if (!this.filter) {
      return;
    }

    this.filterSubscription = observableFromEvent(
      this.filter.nativeElement,
      'keyup',
    )
      .pipe(debounceTime(250), distinctUntilChanged())
      .pipe(untilDestroyed(this)).subscribe(() => {
        this.filterValue = this.filter.nativeElement.value || '';
        this.filterDatasets(this.filterValue);
      });
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

  resetDatasetFilter(): void {
    this.filterValue = '';
    this.filter.nativeElement.value = '';
    this.filterDatasets('');
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
