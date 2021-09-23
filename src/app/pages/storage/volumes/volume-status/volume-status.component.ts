import { Component, OnDestroy, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as filesize from 'filesize';
import * as _ from 'lodash';
import { TreeNode } from 'primeng/api';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CoreService } from 'app/core/services/core-service/core.service';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/volume-status';
import { CoreEvent } from 'app/interfaces/events';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { Pool, PoolScan, PoolTopologyCategory } from 'app/interfaces/pool.interface';
import { VDev, VDevStats } from 'app/interfaces/storage.interface';
import { DialogFormConfiguration } from 'app/pages/common/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/pages/common/entity/entity-dialog/entity-dialog.component';
import { FieldConfig, FormSelectConfig } from 'app/pages/common/entity/entity-form/models/field-config.interface';
import { matchOtherValidator } from 'app/pages/common/entity/entity-form/validators/password-validation/password-validation';
import { EntityJobComponent } from 'app/pages/common/entity/entity-job/entity-job.component';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { EntityTreeTable } from 'app/pages/common/entity/entity-tree-table/entity-tree-table.model';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DiskFormComponent } from 'app/pages/storage/disks/disk-form/disk-form.component';
import {
  WebSocketService, AppLoaderService, DialogService,
} from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { ModalService } from 'app/services/modal.service';
import { T } from 'app/translate-marker';

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
  selector: 'volume-status',
  templateUrl: './volume-status.component.html',
  styleUrls: ['./volume-status.component.scss'],
})
export class VolumeStatusComponent implements OnInit, OnDestroy {
  actionEvents$: Subject<CoreEvent>;
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
      { name: T('Name'), prop: 'name' },
      { name: T('Read'), prop: 'read' },
      { name: T('Write'), prop: 'write' },
      { name: T('Checksum'), prop: 'checksum' },
      { name: T('Status'), prop: 'status' },
      { name: T('Actions'), prop: 'actions', hidden: false },
    ],
  };

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

  constructor(
    protected aroute: ActivatedRoute,
    protected core: CoreService,
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected matDialog: MatDialog,
    protected localeService: LocaleService,
    protected modalService: ModalService,
    protected translate: TranslateService,
  ) {}

  getZfsPoolScan(poolName: string): void {
    this.ws.subscribe('zfs.pool.scan').pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res.fields && res.fields.name == poolName) {
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

      // if pool is passphrase protected, abled passphrase field.
      if (pools[0].encrypt === 2) {
        [this.replaceDiskFormFields, this.extendVdevFormFields].forEach((formFields) => {
          _.find(formFields, { name: 'passphrase' })['isHidden'] = false;
          _.find(formFields, { name: 'passphrase' }).disabled = false;
          _.find(formFields, { name: 'passphrase2' })['isHidden'] = false;
          _.find(formFields, { name: 'passphrase2' }).disabled = false;
        });
      }
      this.poolScan = pools[0].scan;
      // subscribe zfs.pool.scan to get scrub job info
      if (this.poolScan.state == PoolScanState.Scanning) {
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
      const diskConfig: FormSelectConfig = _.find(this.replaceDiskFormFields, { name: 'disk' });
      diskConfig.options = availableDisks;

      const newDiskConfig: FormSelectConfig = _.find(this.extendVdevFormFields, { name: 'new_disk' });
      newDiskConfig.options = availableDisksForExtend;
    });
  }

  ngOnInit(): void {
    // Setup Global Actions
    const actionId = 'refreshBtn';
    this.actionEvents$ = new Subject();
    this.actionEvents$.pipe(untilDestroyed(this)).subscribe((evt) => {
      if (evt.data[actionId]) {
        this.refresh();
      }
    });

    const toolbarConfig: ToolbarConfig = {
      target: this.actionEvents$,
      controls: [
        {
          type: 'button',
          name: actionId,
          label: 'Refresh',
          color: 'primary',
        },
      ],
    };

    const actionsConfig = { actionType: EntityToolbarComponent, actionConfig: toolbarConfig };
    this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });

    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = parseInt(params['pk'], 10);
      this.getData();
    });

    this.getUnusedDisk();
  }

  ngOnDestroy(): void {
    this.actionEvents$.complete();
    this.core.unregister({ observerClass: this });
  }

  refresh(): void {
    this.loader.open();
    this.getData();
    this.loader.close();
  }

  getAction(data: any, category: PoolTopologyCategory, vdev_type: VDevType): any {
    const actions = [{
      id: 'edit',
      label: helptext.actions_label.edit,
      onClick: (row: any) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.ws.call('disk.query', [[['devname', '=', diskName]]]).pipe(untilDestroyed(this)).subscribe((res) => {
          this.onClickEdit(res[0].identifier);
        });
      },
      isHidden: false,
    }, {
      id: 'offline',
      label: helptext.actions_label.offline,
      onClick: (row: any) => {
        let name = row.name;
        // if use path as name, show the full path
        if (!_.startsWith(name, '/')) {
          const pIndex = name.lastIndexOf('p');
          name = pIndex > -1 ? name.substring(0, pIndex) : name;
        }
        this.dialogService.confirm({
          title: helptext.offline_disk.title,
          message: helptext.offline_disk.message + name + '?' + (this.pool.encrypt == 0 ? '' : helptext.offline_disk.encryptPoolWarning),
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
              new EntityUtils().handleWSError(this, err, this.dialogService);
            },
          );
        });
      },
      isHidden: data.status == 'OFFLINE',
    }, {
      id: 'online',
      label: helptext.actions_label.online,
      onClick: (row: any) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.dialogService.confirm({
          title: helptext.online_disk.title,
          message: helptext.online_disk.message + diskName + '?',
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
              new EntityUtils().handleWSError(this, err, this.dialogService);
            },
          );
        });
      },
      isHidden: !!(data.status == 'ONLINE' || this.pool.encrypt !== 0),
    }, {
      id: 'replace',
      label: helptext.actions_label.replace,
      onClick: (row: any) => {
        let name = row.name;
        if (!_.startsWith(name, '/')) {
          const pIndex = name.lastIndexOf('p');
          name = pIndex > -1 ? name.substring(0, pIndex) : name;
        }
        const pk = this.pk;
        _.find(this.replaceDiskFormFields, { name: 'label' }).value = row.guid;

        const conf: DialogFormConfiguration = {
          title: helptext.replace_disk.form_title + name,
          fieldConfig: this.replaceDiskFormFields,
          saveButtonText: helptext.replace_disk.saveButtonText,
          parent: this,
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
                '',
                'info',
                true,
              );
            });
            dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: Job) => {
              dialogRef.close();
              entityDialog.dialogRef.close();
              let err = helptext.replace_disk.err_msg;
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
      onClick: (row: any) => {
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
      isHidden: false,
    }, {
      id: 'detach',
      label: helptext.actions_label.detach,
      onClick: (row: any) => {
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
              new EntityUtils().handleWSError(this, err, this.dialogService);
            },
          );
        });
      },
      isHidden: true,
    }];

    if (category == 'data') {
      _.find(actions, { id: 'remove' }).isHidden = true;
    } else if (category == 'spare') {
      _.find(actions, { id: 'online' }).isHidden = true;
      _.find(actions, { id: 'offline' }).isHidden = true;
      _.find(actions, { id: 'Replace' }).isHidden = true;
    } else if (category == 'cache') {
      _.find(actions, { id: 'online' }).isHidden = true;
      _.find(actions, { id: 'offline' }).isHidden = true;
    }

    if (vdev_type === VDevType.Mirror || vdev_type === VDevType.Replacing || vdev_type === VDevType.Spare) {
      _.find(actions, { id: 'detach' }).isHidden = false;
    }

    if (vdev_type === VDevType.Mirror) {
      _.find(actions, { id: 'remove' }).isHidden = true;
    }

    return actions;
  }

  extendAction(): any[] {
    return [{
      id: 'extend',
      label: helptext.actions_label.extend,
      onClick: (row: any) => {
        const pk = this.pk;
        _.find(this.extendVdevFormFields, { name: 'target_vdev' }).value = row.guid;
        const conf: DialogFormConfiguration = {
          title: helptext.extend_disk.form_title,
          fieldConfig: this.extendVdevFormFields,
          saveButtonText: helptext.extend_disk.saveButtonText,
          parent: this,
          customSubmit: (entityDialog: EntityDialogComponent) => {
            delete entityDialog.formValue['passphrase2'];

            const dialogRef = this.matDialog.open(EntityJobComponent, {
              data: { title: helptext.extend_disk.title },
              disableClose: true,
            });
            dialogRef.componentInstance.setDescription(helptext.extend_disk.description);
            dialogRef.componentInstance.setCall('pool.attach', [pk, entityDialog.formValue]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
              dialogRef.close(true);
              entityDialog.dialogRef.close(true);
              this.getData();
              this.getUnusedDisk();
              this.dialogService.info(helptext.extend_disk.title, helptext.extend_disk.info_dialog_content + name + '.', '', 'info', true);
            });
            dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((res: Job) => {
              dialogRef.close();
              entityDialog.dialogRef.close();
              let err = helptext.extend_disk.err_msg;
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
      onClick: (row: any) => {
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

  parseData(data: Pool | VDev, category?: PoolTopologyCategory, vdev_type?: VDevType): PoolDiskInfo {
    let stats = {
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
    } as VDevStats;

    if ('stats' in data) {
      stats = data.stats;
    }
    if ('type' in data && data.type != VDevType.Disk) {
      (data as any).name = data.type;
    }
    // use path as the device name if the device name is null
    if (!(data as VDev).disk || (data as VDev).disk == null) {
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
      if (data.type == VDevType.Disk) {
        item.actions = [{ title: 'Disk Actions', actions: this.getAction(data, category, vdev_type) }];
      } else if (data.type === VDevType.Mirror) {
        item.actions = [{ title: 'Mirror Actions', actions: this.extendAction() }];
      }
    }
    return item;
  }

  parseTopolgy(data: VDev, category: PoolTopologyCategory, vdev_type?: VDevType): TreeNode {
    const node: TreeNode = {};
    node.data = this.parseData(data, category, vdev_type);
    node.expanded = true;
    node.children = [];

    if (data.children) {
      if (data.children.length === 0 && vdev_type === undefined) {
        const extend_action = this.extendAction();
        node.data.actions.push(extend_action[0]);
      }
      vdev_type = (data as any).name;
      for (let i = 0; i < data.children.length; i++) {
        node.children.push(this.parseTopolgy(data.children[i], category, vdev_type));
      }
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

      for (let i = 0; i < pool.topology[category].length; i++) {
        if (category != 'data') {
          topoNode.children.push(this.parseTopolgy(pool.topology[category][i], category));
        } else {
          node.children.push(this.parseTopolgy(pool.topology[category][i], category));
        }
      }
      if (category != 'data' && pool.topology[category].length > 0) {
        node.children.push(topoNode);
      }
    }
    delete node.data.children;
    this.treeTableConfig = {
      tableData: [node],
      columns: [...this.treeTableConfig.columns],
    };
  }

  getReadableDate(data: any): string {
    if (data != null) {
      return this.localeService.formatDateTime(new Date(data.$date));
    }
  }

  onClickEdit(pk: string): void {
    const diskForm = this.modalService.openInSlideIn(DiskFormComponent);
    diskForm.inIt(pk);
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
      new EntityUtils().handleWSError(this, error, this.dialogService);
    });
  }
}
