import {
  Component,
  ElementRef,
  Input,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core'
import { Router } from '@angular/router'
import { fromEvent as observableFromEvent, Subscription } from 'rxjs'
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'
import { TranslateService } from '@ngx-translate/core'

import { RestService } from '../../../../services/rest.service'
import { GlobalAction } from 'app/components/common/pagetitle/pagetitle.component'
import { CoreService } from 'app/core/services/core.service'
import { ModalService } from 'app/services/modal.service'
import { VolumeImportWizardComponent } from '../volume-import-wizard'
import { AppLoaderService, DialogService, WebSocketService } from 'app/services'
import { MatDialog } from '@angular/material/dialog'
import { HttpClient } from '@angular/common/http'
import { MessageService } from 'app/pages/common/entity/entity-form/services/message.service'
import helptext from 'app/helptext/storage/volumes/volume-list'
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface'
import { EntityJobComponent } from 'app/pages/common/entity/entity-job'
import { EntityUtils } from 'app/pages/common/entity/utils'
import { T } from 'app/translate-marker'
import _ from 'lodash'

@Component({
  selector: 'app-volumes-list-controls',
  templateUrl: './volumes-list-controls.component.html',
  providers: [MessageService],
})
export class VolumesListControlsComponent
  implements GlobalAction, OnInit, AfterViewInit, OnDestroy {
  @ViewChild('filter', { static: false }) filter: ElementRef
  @Input() entity: any // Can't specify VolumesListComponent without creating circular dependency;

  public conf
  public filterValue: string = ''
  public actions: any[]
  public menuTriggerMessage: string = 'Click for options'
  public spin: boolean = true
  public direction: string = 'left'
  public animationMode: string = 'fling'
  public poolList: any[] = []

  private poolValue: string
  private dialogRef: any
  private filterSubscription: Subscription
  private poolChoicesSubscription: Subscription
  private poolConfigSubscription: Subscription

  get totalActions(): number {
    const addAction = this.entity.conf.route_add ? 1 : 0
    return this.actions.length + addAction
  }

  constructor(
    protected translate: TranslateService,
    public router: Router,
    public core: CoreService,
    public modalService: ModalService,
    protected rest: RestService,
    protected ws: WebSocketService,
    protected loader: AppLoaderService,
    protected dialog: MatDialog,
    protected dialogService: DialogService,
    protected http: HttpClient,
    public messageService: MessageService
  ) {}

  ngOnInit() {
    this.getSystemDatasetPool()
  }

  ngOnDestroy() {
    if (this.filterSubscription) {
      this.filterSubscription.unsubscribe()
    }
    if (this.poolChoicesSubscription) {
      this.poolChoicesSubscription.unsubscribe()
    }
    if (this.poolConfigSubscription) {
      this.poolConfigSubscription.unsubscribe()
    }
  }

  ngAfterViewInit() {
    if (this.filter) {
      this.filterSubscription = observableFromEvent(
        this.filter.nativeElement,
        'keyup'
      )
        .pipe(debounceTime(250), distinctUntilChanged())
        .subscribe(() => {
          this.filterValue = this.filter.nativeElement.value
            ? this.filter.nativeElement.value
            : ''
          this.filterDatasets(this.filterValue)
        })
    }
  }

  applyConfig(config: any) {
    if (config) {
      this.actions = config.getAddActions()
      this.conf = config.conf
      this.entity = config
    } else {
      throw 'This component requires an entity class for a config'
    }
  }

  navigate(path: string) {
    this.router.navigate(path.split('/'))
  }

  resetDatasetFilter() {
    this.filterValue = ''
    this.filter.nativeElement.value = ''
    this.filterDatasets('')
  }

  filterDatasets(value: string) {
    this.core.emit({
      name: 'TreeTableGlobalFilter',
      data: { column: 'name', value: value },
      sender: this,
    })
  }

  onClickImport() {
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
        this.modalService
      )
    )
  }

  onChooseSystemDatasetPool() {
    this.poolChoicesSubscription = this.ws
      .call('systemdataset.pool_choices')
      .subscribe((res: { [key: string]: string }) => {
        this.poolList = []
        Object.keys(res).forEach((pool) => {
          this.poolList.push({ label: res[pool], value: pool })
        })
        this.dialogService.dialogForm(
          this.getSystemDatasetPoolDialogConfiguration(),
          true
        )
      })
  }

  getSystemDatasetPoolDialogConfiguration(): DialogFormConfiguration {
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
    }
  }

  getSystemDatasetPool() {
    this.poolConfigSubscription = this.ws
      .call('systemdataset.config')
      .subscribe((res) => {
        this.poolValue = res.pool
      })
  }
  
  customSubmitSystemDatasetPool(entityDialog: any) {
    const self = entityDialog.parent
    self.loader.open()
    self.ws.call('service.query').subscribe((services) => {
      const smbShare = _.find(services, { service: 'cifs' })
      if (smbShare.state === 'RUNNING') {
        self.loader.close()
        self.dialogService
          .confirm(
            T('Restart SMB Service'),
            T('The system dataset will be updated and the SMB service restarted. This will cause a temporary disruption of any active SMB connections.'),
            false,
            T('Continue')
          )
          .subscribe((confirmed) => {
            if (confirmed) {
              self.updateSystemDatasetPool(entityDialog)
            }
          })
      } else {
        self.loader.close()
        self.updateSystemDatasetPool(entityDialog)
      }
    })

  }

  updateSystemDatasetPool(entityDialog: any) {
    const self = entityDialog.parent
    const pool = entityDialog.formGroup.controls['pools'].value
    self.dialogRef = self.dialog.open(EntityJobComponent, {
      data: { title: helptext.choosePool.jobTitle },
      disableClose: true,
    })
    self.dialogRef.componentInstance.setCall('systemdataset.update', [
      { pool: pool },
    ])
    self.dialogRef.componentInstance.submit()
    self.dialogRef.componentInstance.success.subscribe((res) => {
      if (res.error) {
        if (res.exc_info && res.exc_info.extra) {
          res.extra = res.exc_info.extra
        }
        new EntityUtils().handleWSError(this, res)
      }
      if (res.state === 'SUCCESS') {
        self.poolValue = pool
        self.entity.systemdatasetPool = pool
        self.dialogService.closeAllDialogs()
        self.translate.get(helptext.choosePool.message).subscribe((msg) => {
          self.dialogService.Info(
            helptext.choosePool.success,
            msg + res.result.pool,
            '500px',
            'info',
            true
          )
        })
      }
    })
    self.dialogRef.componentInstance.failure.subscribe((err) => {
      new EntityUtils().handleWSError(self, err, self.dialogService)
    })
  }
}
