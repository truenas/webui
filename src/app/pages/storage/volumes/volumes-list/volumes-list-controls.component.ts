import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { Router } from '@angular/router';
import { Service } from 'app/interfaces/service.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { VolumesListComponent } from 'app/pages/storage/volumes/volumes-list/volumes-list.component';
import { fromEvent as observableFromEvent, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { RestService } from '../../../../services/rest.service';
import { GlobalAction } from 'app/components/common/pagetitle/pagetitle.component';
import { CoreService } from 'app/core/services/core.service';
import { ModalService } from 'app/services/modal.service';
import { VolumeImportWizardComponent } from '../volume-import-wizard';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { MatDialog } from '@angular/material/dialog';
import { HttpClient } from '@angular/common/http';
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service';
import helptext from 'app/helptext/storage/volumes/volume-list';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { T } from 'app/translate-marker';
import _ from 'lodash';
import { EntityJobState } from 'app/enums/entity-job-state.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';

@Component({
  selector: 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html',
  providers: [MessageService],
})
export class VolumesListControlsComponent implements GlobalAction, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('filter', { static: false }) filter: ElementRef;
  @Input() entity: VolumesListComponent;

  conf: any;
  filterValue = '';
  actions: any[];
  poolList: any[] = [];

  private poolValue: string;
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

  ngOnInit(): void {
    this.getSystemDatasetPool();
  }

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
      .subscribe(() => {
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

  // TODO: Candidate for removal
  navigate(path: string): void {
    this.router.navigate(path.split('/'));
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

  onChooseSystemDatasetPool() {
    this.poolChoicesSubscription = this.ws
      .call('systemdataset.pool_choices')
      .subscribe((poolOptions) => {
        this.poolList = Object.entries(poolOptions)
          .map(([label, value]) => ({ label, value }));

        this.dialogService.dialogForm(
          this.getSystemDatasetPoolDialogConfiguration(),
          true,
        );
      });
  }

  getSystemDatasetPoolDialogConfiguration(): DialogFormConfiguration<this> {
    return {
      title: helptext.choosePool.title,
      fieldConfig: [
        {
          type: 'select',
          name: 'pools',
          placeholder: helptext.choosePool.placeholder,
          required: true,
          options: this.poolList,
          value: this.poolValue,
        },
      ],
      method_ws: 'systemdataset.update',
      saveButtonText: helptext.choosePool.action,
      customSubmit: this.customSubmitSystemDatasetPool,
      parent: this,
    };
  }

  getSystemDatasetPool(): void {
    this.poolConfigSubscription = this.ws
      .call('systemdataset.config')
      .subscribe((res) => {
        this.poolValue = res.pool;
      });
  }

  customSubmitSystemDatasetPool(entityDialog: EntityDialogComponent<VolumesListControlsComponent>): void {
    const self = entityDialog.parent;
    self.loader.open();
    self.ws.call('service.query').subscribe((services) => {
      const smbService = _.find(services, { service: 'cifs' });
      if (smbService.state === ServiceStatus.Running) {
        self.loader.close();
        self.dialogService
          .confirm(
            T('Restart SMB Service'),
            T('The system dataset will be updated and the SMB service restarted. This will cause a temporary disruption of any active SMB connections.'),
            false,
            T('Continue'),
          )
          .subscribe((confirmed: boolean) => {
            if (confirmed) {
              self.updateSystemDatasetPool(entityDialog);
            }
          });
      } else {
        self.loader.close();
        self.updateSystemDatasetPool(entityDialog);
      }
    });
  }

  updateSystemDatasetPool(entityDialog: any): void {
    const self = entityDialog.parent;
    const pool = entityDialog.formGroup.controls['pools'].value;
    self.dialogRef = self.dialog.open(EntityJobComponent, {
      data: { title: helptext.choosePool.jobTitle },
      disableClose: true,
    });
    self.dialogRef.componentInstance.setCall('systemdataset.update', [
      { pool },
    ]);
    self.dialogRef.componentInstance.submit();
    self.dialogRef.componentInstance.success.subscribe((res: any) => {
      if (res.error) {
        if (res.exc_info && res.exc_info.extra) {
          res.extra = res.exc_info.extra;
        }
        new EntityUtils().handleWSError(this, res);
      }
      if (res.state === EntityJobState.Success) {
        self.poolValue = pool;
        self.entity.systemdatasetPool = pool;
        self.dialogService.closeAllDialogs();
        self.translate.get(helptext.choosePool.message).subscribe((msg: string) => {
          self.dialogService.Info(
            helptext.choosePool.success,
            msg + res.result.pool,
            '500px',
            'info',
            true,
          );
        });
      }
    });
    self.dialogRef.componentInstance.failure.subscribe((err: any) => {
      new EntityUtils().handleWSError(self, err, self.dialogService);
    });
  }
}
