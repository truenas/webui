import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { InputTableConf } from 'app/pages/common/entity/entity-table/entity-table.component';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';
import { fromEvent as observableFromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { RestService } from '../../../../services/rest.service';
import { GlobalAction } from 'app/components/common/pagetitle/pagetitle.component';
import { CoreService } from 'app/core/services/core.service';
import { ModalService } from 'app/services/modal.service';
import { VolumeImportWizardComponent } from '../volume-import-wizard';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html',
  providers: [MessageService],
})
export class VolumesListControlsComponent implements GlobalAction, AfterViewInit, OnDestroy {
  @ViewChild('filter', { static: false }) filter: ElementRef;
  @Input() entity: VolumesListComponent;

  conf: InputTableConf;
  filterValue = '';
  actions: any[];

  private filterSubscription: Subscription;
  private poolChoicesSubscription: Subscription;
  private poolConfigSubscription: Subscription;

  get totalActions(): number {
    const addAction = this.entity.conf.route_add ? 1 : 0;
    return this.actions.length + addAction;
  }

  constructor(
    private router: Router,
    private core: CoreService,
    private modalService: ModalService,
    private rest: RestService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialog: MatDialog,
    private dialogService: DialogService,
    private http: HttpClient,
    private messageService: MessageService,
  ) {}

  ngOnDestroy(): void {
    this.filterSubscription?.unsubscribe();
    this.poolChoicesSubscription?.unsubscribe();
    this.poolConfigSubscription?.unsubscribe();
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
      throw 'This component requires an entity class for a config';
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
    this.modalService.open(
      'slide-in-form',
      new VolumeImportWizardComponent(
        this.rest,
        this.ws,
        this.router,
        this.loader,
        this.dialog,
        this.dialogService,
        this.http,
        this.messageService,
        this.modalService,
      ),
    );
  }
}
