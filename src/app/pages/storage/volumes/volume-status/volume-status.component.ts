import {
  AfterViewInit, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as filesize from 'filesize';
import * as _ from 'lodash';
import { TreeNode } from 'primeng/api';
import { filter } from 'rxjs/operators';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/volume-status';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { Pool, PoolScan, PoolTopologyCategory } from 'app/interfaces/pool.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import {
  VDev,
  VDevStats,
  UnusedDisk,
  Disk,
} from 'app/interfaces/storage.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { FieldConfig, FormSelectConfig } from 'app/modules/entity/entity-form/models/field-config.interface';
import { matchOtherValidator } from 'app/modules/entity/entity-form/validators/password-validation/password-validation';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityTreeTable } from 'app/modules/entity/entity-tree-table/entity-tree-table.model';
import { EntityUtils } from 'app/modules/entity/utils';
import { DiskFormComponent } from 'app/pages/storage/disks/disk-form/disk-form.component';
import {
  WebSocketService, AppLoaderService, DialogService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { ModalService } from 'app/services/modal.service';

interface PoolDiskInfo {
  name: string;
  read: number;
  write: number;
  checksum: number;
  status: any;
  actions?: any;
  path?: string;
  guid: string;
}

@UntilDestroy()
@Component({
  templateUrl: './volume-status.component.html',
  styleUrls: ['./volume-status.component.scss'],
})
export class VolumeStatusComponent implements OnInit, AfterViewInit {
  poolScan: PoolScan;
  timeRemaining = {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  } ;
  treeTableConfig: EntityTreeTable = {
    tableData: [],
    columns: [
      { name: this.translate.instant('Name'), prop: 'name' },
      { name: this.translate.instant('Read'), prop: 'read' },
      { name: this.translate.instant('Write'), prop: 'write' },
      { name: this.translate.instant('Checksum'), prop: 'checksum' },
      { name: this.translate.instant('Status'), prop: 'status' },
      { name: this.translate.instant('Actions'), prop: 'actions', hidden: false },
    ],
  };

  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  protected pk: number;
  expandRows: number[] = [1];

  protected replaceDiskFormFields: FieldConfig[] = [{
    type: 'input',
    name: 'label',
    value: '',
    isHidden: true,
  }, {
    type: 'select',
    name: 'disk',
    placeholder: helptext.dialogFormFields.disk.placeholder,
    tooltip: helptext.dialogFormFields.disk.tooltip,
    options: [],
    required: true,
    validation: [Validators.required],
  }, {
    type: 'input',
    inputType: 'password',
    name: 'passphrase',
    placeholder: helptext.dialogFormFields.passphrase.placeholder,
    tooltip: helptext.dialogFormFields.passphrase.tooltip,
    required: true,
    isHidden: true,
    disabled: true,
  }, {
    type: 'input',
    inputType: 'password',
    name: 'passphrase2',
    placeholder: helptext.dialogFormFields.passphrase2.placeholder,
    tooltip: helptext.dialogFormFields.passphrase2.tooltip,
    validation: [matchOtherValidator('passphrase')],
    required: true,
    isHidden: true,
    disabled: true,
  }, {
    type: 'checkbox',
    name: 'force',
    placeholder: helptext.dialogFormFields.force.placeholder,
    tooltip: helptext.dialogFormFields.force.tooltip,
  }];
  protected extendVdevFormFields: FieldConfig[] = [{
    type: 'input',
    name: 'target_vdev',
    value: '',
    isHidden: true,
  }, {
    type: 'select',
    name: 'new_disk',
    placeholder: helptext.dialogFormFields.new_disk.placeholder,
    tooltip: helptext.dialogFormFields.new_disk.tooltip,
    options: [],
    required: true,
    validation: [Validators.required],
  }, {
    type: 'input',
    inputType: 'password',
    name: 'passphrase',
    placeholder: helptext.dialogFormFields.passphrase.placeholder,
    tooltip: helptext.dialogFormFields.passphrase.tooltip,
    required: true,
    isHidden: true,
    disabled: true,
  }, {
    type: 'input',
    inputType: 'password',
    name: 'passphrase2',
    placeholder: helptext.dialogFormFields.passphrase2.placeholder,
    tooltip: helptext.dialogFormFields.passphrase2.tooltip,
    validation: [matchOtherValidator('passphrase')],
    required: true,
    isHidden: true,
    disabled: true,
  }];

  readonly PoolScanState = PoolScanState;

  protected pool: Pool;

  private duplicateSerialDisks: UnusedDisk[] = [];

  constructor(
    protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected matDialog: MatDialog,
    protected modalService: ModalService,
    protected translate: TranslateService,
    private slideIn: IxSlideInService,
    private layoutService: LayoutService,
  ) {}

  getZfsPoolScan(poolName: string): void {
    this.ws.subscribe('zfs.pool.scan').pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res.fields && res.fields.name === poolName) {
          this.poolScan = res.fields.scan;
          const seconds = this.poolScan.total_secs_left;
          this.timeRemaining = {
            days: Math.floor(seconds / (3600 * 24)),
            hours: Math.floor(seconds % (3600 * 24) / 3600),
            minutes: Math.floor(seconds % 3600 / 60),
            seconds: Math.floor(seconds % 60),
          };
        }
      },
    );
  }

  getData(): void {
    this.ws.call('pool.query', [[['id', '=', this.pk]]]).pipe(untilDestroyed(this)).subscribe((pools) => {
      this.pool = pools[0];
      if (!pools[0]) {
        return;
      }

      this.poolScan = pools[0].scan;
      // subscribe zfs.pool.scan to get scrub job info
      if (this.poolScan.state === PoolScanState.Scanning) {
        this.getZfsPoolScan(pools[0].name);
      }
      this.dataHandler(pools[0]);
    },
    (err) => {
      new EntityUtils().handleError(this, err);
    });
  }

  getUnusedDisk(): void {
    const availableDisks: Option[] = [];
    const availableDisksForExtend: Option[] = [];
    this.ws.call('disk.get_unused').pipe(untilDestroyed(this)).subscribe((disks) => {
      disks.forEach((disk) => {
        availableDisks.push({
          label: disk.devname,
          value: disk.identifier,
        });
        availableDisksForExtend.push({
          label: disk.devname + ' (' + filesize(disk.size, { standard: 'iec' }) + ')',
          value: disk.name,
        });
      });
      const diskConfig = _.find(this.replaceDiskFormFields, { name: 'disk' }) as FormSelectConfig;
      diskConfig.options = availableDisks;

      const newDiskConfig = _.find(this.extendVdevFormFields, { name: 'new_disk' }) as FormSelectConfig;
      newDiskConfig.options = availableDisksForExtend;

      this.duplicateSerialDisks = disks.filter((disk) => disk.duplicate_serial.length);
    });
  }

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = parseInt(params['pk'], 10);
      this.getData();
    });

    this.getUnusedDisk();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  refresh(): void {
    this.loader.open();
    this.getData();
    this.loader.close();
  }

  getAction(data: VDev, category: PoolTopologyCategory, vdevType: VDevType): any {
    const actions = [{
      id: 'edit',
      label: helptext.actions_label.edit,
      onClick: (row: Pool) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;
        const queryCallOption: QueryParams<Disk, { extra: { passwords: boolean } }> = [[['devname', '=', diskName]], { extra: { passwords: true } }];
        this.ws.call('disk.query', queryCallOption).pipe(untilDestroyed(this)).subscribe((disks) => {
          this.onClickEdit(disks[0]);
        });
      },
      isHidden: false,
    }, {
      id: 'offline',
      label: helptext.actions_label.offline,
      onClick: (row: Pool) => {
        let name = row.name;
        // if use path as name, show the full path
        if (!_.startsWith(name, '/')) {
          const pIndex = name.lastIndexOf('p');
          name = pIndex > -1 ? name.substring(0, pIndex) : name;
        }
        this.dialogService.confirm({
          title: helptext.offline_disk.title,
          message: this.translate.instant(helptext.offline_disk.message) + name + '?',
          buttonMsg: helptext.offline_disk.buttonMsg,
        }).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.loader.open();
          const value = { label: row.guid };
          this.ws.call('pool.offline', [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
            () => {
              this.getData();
              this.loader.close();
            },
            (err) => {
              this.loader.close();
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          );
        });
      },
      isHidden: data.status === 'OFFLINE',
    }, {
      id: 'online',
      label: helptext.actions_label.online,
      onClick: (row: Pool) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.dialogService.confirm({
          title: helptext.online_disk.title,
          message: this.translate.instant(helptext.online_disk.message) + diskName + '?',
          buttonMsg: helptext.online_disk.buttonMsg,
        }).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.loader.open();
          const value = { label: row.guid };
          this.ws.call('pool.online', [this.pk, value]).pipe(untilDestroyed(this)).subscribe(
            () => {
              this.getData();
              this.loader.close();
            },
            (err) => {
              this.loader.close();
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          );
        });
      },
      isHidden: !!(data.status === 'ONLINE' || this.pool.encrypt !== 0),
    }, {
      id: 'replace',
      label: helptext.actions_label.replace,
      onClick: (row: Pool) => {
        let name = row.name;
        if (!_.startsWith(name, '/')) {
          const pIndex = name.lastIndexOf('p');
          name = pIndex > -1 ? name.substring(0, pIndex) : name;
        }
        const pk = this.pk;
        _.find(this.replaceDiskFormFields, { name: 'label' }).value = row.guid;

        const conf: DialogFormConfiguration = {
          title: this.translate.instant(helptext.replace_disk.form_title) + name,
          fieldConfig: this.replaceDiskFormFields,
          saveButtonText: helptext.replace_disk.saveButtonText,
          customSubmit: (entityDialog: EntityDialogComponent) => {
            delete entityDialog.formValue['passphrase2'];

            const dialogRef = this.matDialog.open(EntityJobComponent, {
              data: { title: helptext.replace_disk.title },
              disableClose: true,
            });
            dialogRef.componentInstance.setDescription(helptext.replace_disk.description);
            dialogRef.componentInstance.setCall('pool.replace', [pk, entityDialog.formValue]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              dialogRef.close(true);
              entityDialog.dialogRef.close(true);
              this.getData();
              this.getUnusedDisk();
              this.dialogService.info(
                helptext.replace_disk.title,
                this.translate.instant('Successfully replaced disk {disk}.', { disk: name }),
              );
            });
            dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: Job) => {
              dialogRef.close();
              entityDialog.dialogRef.close();
              let err: string = helptext.replace_disk.err_msg;
              if (res.error.startsWith('[EINVAL]')) {
                err = res.error;
              }
              this.dialogService.errorReport(helptext.replace_disk.err_title, err, res.exception);
            });
          },
        };
        this.dialogService.dialogForm(conf);
      },
      isHidden: false,
    }, {
      id: 'remove',
      label: helptext.actions_label.remove,
      onClick: (row: Pool) => {
        let diskName = row.name;
        if (!_.startsWith(row.name, '/')) {
          const pIndex = row.name.lastIndexOf('p');
          diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;
        }

        this.dialogService.confirm({
          title: helptext.remove_disk.title,
          message: this.translate.instant(helptext.remove_disk.message) + diskName + '?',
          buttonMsg: helptext.remove_disk.buttonMsg,
        }).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.poolRemove(this.pk, row.guid);
        });
      },
      isHidden: false,
    }, {
      id: 'detach',
      label: helptext.actions_label.detach,
      onClick: (row: Pool) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.dialogService.confirm({
          title: helptext.detach_disk.title,
          message: helptext.detach_disk.message + diskName + '?',
          buttonMsg: helptext.detach_disk.buttonMsg,
        }).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.loader.open();
          this.ws.call('pool.detach', [this.pk, { label: row.guid }]).pipe(untilDestroyed(this)).subscribe(
            () => {
              this.getData();
              this.getUnusedDisk();
              this.loader.close();
            },
            (err) => {
              this.loader.close();
              new EntityUtils().handleWsError(this, err, this.dialogService);
            },
          );
        });
      },
      isHidden: true,
    }];

    if (category === 'data') {
      _.find(actions, { id: 'remove' }).isHidden = true;
    } else if (category === 'spare') {
      _.find(actions, { id: 'online' }).isHidden = true;
      _.find(actions, { id: 'offline' }).isHidden = true;
      _.find(actions, { id: 'replace' }).isHidden = true;
    } else if (category === 'cache') {
      _.find(actions, { id: 'online' }).isHidden = true;
      _.find(actions, { id: 'offline' }).isHidden = true;
    }

    if (vdevType === VDevType.Mirror || vdevType === VDevType.Replacing || vdevType === VDevType.Spare) {
      _.find(actions, { id: 'detach' }).isHidden = false;
    }

    if (vdevType === VDevType.Mirror) {
      _.find(actions, { id: 'remove' }).isHidden = true;
    }

    return actions;
  }

  extendAction(): any[] {
    return [{
      id: 'extend',
      label: helptext.actions_label.extend,
      onClick: (row: Pool) => {
        const pk = this.pk;
        _.find(this.extendVdevFormFields, { name: 'target_vdev' }).value = row.guid;
        const conf: DialogFormConfiguration = {
          title: helptext.extend_disk.form_title,
          fieldConfig: this.extendVdevFormFields,
          saveButtonText: helptext.extend_disk.saveButtonText,
          customSubmit: (entityDialog: EntityDialogComponent) => {
            const body = { ...entityDialog.formValue };
            delete body['passphrase2'];

            const dialogRef = this.matDialog.open(EntityJobComponent, {
              data: { title: helptext.extend_disk.title },
              disableClose: true,
            });
            if (this.duplicateSerialDisks.find((disk) => disk.name === entityDialog.formValue.new_disk)) {
              body['allow_duplicate_serials'] = true;
            }
            dialogRef.componentInstance.setDescription(helptext.extend_disk.description);
            dialogRef.componentInstance.setCall('pool.attach', [pk, body]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              dialogRef.close(true);
              entityDialog.dialogRef.close(true);
              this.getData();
              this.getUnusedDisk();

              let diskName = row.name;
              if (!_.startsWith(row.name, '/')) {
                const pIndex = row.name.lastIndexOf('p');
                diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;
              }

              this.dialogService.info(
                helptext.extend_disk.title,
                this.translate.instant(helptext.extend_disk.info_dialog_content) + diskName + '.',
              );
            });
            dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: Job) => {
              dialogRef.close();
              entityDialog.dialogRef.close();
              let err: string = helptext.extend_disk.err_msg;
              if (res.error.startsWith('[EINVAL]')) {
                err = res.error;
              }
              this.dialogService.errorReport(helptext.extend_disk.err_title, err, res.exception);
            });
          },
        };
        this.dialogService.dialogForm(conf);
      },
    }, {
      id: 'Remove',
      label: helptext.actions_label.remove,
      onClick: (row: Pool) => {
        let diskName = row.name;
        if (!_.startsWith(row.name, '/')) {
          const pIndex = row.name.lastIndexOf('p');
          diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;
        }

        this.dialogService.confirm({
          title: helptext.remove_disk.title,
          message: helptext.remove_disk.message + diskName + '?',
          buttonMsg: helptext.remove_disk.buttonMsg,
        }).pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.poolRemove(this.pk, row.guid);
        });
      },
    }];
  }

  parseData(data: Pool | VDev, category?: PoolTopologyCategory, vdevType?: VDevType): PoolDiskInfo {
    let stats = {
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
    } as VDevStats;

    if ('stats' in data) {
      stats = data.stats;
    }
    if ('type' in data && data.type !== VDevType.Disk) {
      (data as any).name = data.type;
    }
    // use path as the device name if the device name is null
    if (!(data as VDev).disk || (data as VDev).disk === null) {
      (data as any).disk = data.path;
    }

    const item: PoolDiskInfo = {
      name: 'name' in data ? data.name : data.disk,
      read: stats.read_errors ? stats.read_errors : 0,
      write: stats.write_errors ? stats.write_errors : 0,
      checksum: stats.checksum_errors ? stats.checksum_errors : 0,
      status: data.status,
      path: data.path,
      guid: data.guid,
    };

    // add actions
    if (category && 'type' in data) {
      if (data.type === VDevType.Disk) {
        item.actions = [{ title: 'Disk Actions', actions: this.getAction(data, category, vdevType) }];
      } else if (data.type === VDevType.Mirror) {
        item.actions = [{ title: 'Mirror Actions', actions: this.extendAction() }];
      }
    }
    return item;
  }

  parseTopolgy(data: VDev, category: PoolTopologyCategory, vdevType?: VDevType): TreeNode {
    const node: TreeNode = {};
    node.data = this.parseData(data, category, vdevType);
    node.expanded = true;
    node.children = [];

    if (data.children) {
      if (data.children.length === 0 && vdevType === undefined) {
        const extendAction = this.extendAction();
        node.data.actions[0].actions.push(extendAction[0]);
      }
      vdevType = (data as any).name;
      data.children.forEach((child) => {
        node.children.push(this.parseTopolgy(child, category, vdevType));
      });
    }
    delete node.data.children;
    return node;
  }

  dataHandler(pool: Pool): void {
    const node: TreeNode = {};
    node.data = this.parseData(pool);
    node.expanded = true;
    node.children = [];

    let category: PoolTopologyCategory;
    for (category in pool.topology) {
      const topoNode: TreeNode = {};
      topoNode.data = {
        name: category,
      };
      topoNode.expanded = true;
      topoNode.children = [];

      pool.topology[category].forEach((vdev) => {
        if (category !== 'data') {
          topoNode.children.push(this.parseTopolgy(vdev, category));
        } else {
          node.children.push(this.parseTopolgy(vdev, category));
        }
      });
      if (category !== 'data' && pool.topology[category].length > 0) {
        node.children.push(topoNode);
      }
    }
    delete node.data.children;
    this.treeTableConfig = {
      tableData: [node],
      columns: [...this.treeTableConfig.columns],
    };
  }

  onClickEdit(disk: Disk): void {
    const editForm = this.slideIn.open(DiskFormComponent, { wide: true });
    editForm.setFormDisk(disk);
  }

  poolRemove(id: number, label: number | string): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptext.remove_disk.title },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('pool.remove', [id, { label }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.dialogService.closeAllDialogs();
      this.getData();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((error) => {
      new EntityUtils().handleWsError(this, error, this.dialogService);
    });
  }
}
