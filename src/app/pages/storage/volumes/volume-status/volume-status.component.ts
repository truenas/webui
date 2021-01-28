import { Component, OnInit, OnDestroy } from '@angular/core';
import { WebSocketService, RestService, AppLoaderService, DialogService } from "../../../../services";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { TreeNode } from 'primeng/api';
import { EntityTreeTable } from '../../../common/entity/entity-tree-table/entity-tree-table.model';

import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { MatDialog } from '@angular/material/dialog';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';
import { LocaleService } from 'app/services/locale.service';
import { T } from '../../../../translate-marker';
import helptext from '../../../../helptext/storage/volumes/volume-status';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

import { CoreService, CoreEvent } from 'app/core/services/core.service';
import { Subject } from 'rxjs';
import { EntityToolbarComponent } from '../../../common/entity/entity-toolbar/entity-toolbar.component';
import { GlobalAction } from 'app/components/common/pagetitle/pagetitle.component';
import { ToolbarConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { ModalService } from 'app/services/modal.service';
import { DiskFormComponent } from '../../disks/disk-form';

interface poolDiskInfo {
  name: any,
  read: any,
  write: any,
  checksum: any,
  status: any,
  actions ?: any,
  path ?: any,
  guid: any,
}

@Component({
  selector: 'volume-status',
  templateUrl: './volume-status.component.html',
  styleUrls: ['./volume-status.component.css']
})
export class VolumeStatusComponent implements OnInit {
  
  public actionEvents: Subject<CoreEvent>;
  public poolScan: any;
  public timeRemaining: any = {};
  public treeTableConfig: EntityTreeTable = {
    tableData: [],
    columns: [
      { name: T('Name'), prop: 'name', },
      { name: T('Read'), prop: 'read', },
      { name: T('Write'), prop: 'write', },
      { name: T('Checksum'), prop: 'checksum', },
      { name: T('Status'), prop: 'status', },
      { name: T('Actions'), prop: 'actions', hidden: false},
    ]
  }

  protected pk: number;
  public expandRows: Array < number > = [1];

  protected editDiskRoute: any = ["storage", "disks", "pool"];
  protected replaceDiskRoute: any = ["storage", "disks", "pool"];

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
    validation : [ matchOtherValidator('passphrase') ],
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
    validation : [ matchOtherValidator('passphrase') ],
    required: true,
    isHidden: true,
    disabled: true,
  }];

  protected pool: any;

  constructor(protected aroute: ActivatedRoute,
    protected core: CoreService,
    protected ws: WebSocketService,
    protected rest: RestService,
    protected translate: TranslateService,
    protected router: Router,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected matDialog: MatDialog,
    protected localeService: LocaleService,
    protected modalService: ModalService
  ) {}

  getZfsPoolScan(poolName) {
    this.ws.subscribe('zfs.pool.scan').subscribe(
      (res) => {
        if (res.fields && res.fields.name == poolName) {
          this.poolScan = res.fields.scan;
          let seconds = this.poolScan.total_secs_left;
          this.timeRemaining = {
            days: Math.floor(seconds / (3600*24)),
            hours: Math.floor(seconds % (3600*24) / 3600),
            minutes: Math.floor(seconds % 3600 / 60),
            seconds: Math.floor(seconds % 60)
          }
        }
      }
    )
  }

  getData() {
    this.ws.call('pool.query', [
      [
        ["id", "=", this.pk]
      ]
    ]).subscribe(
      (res) => {
        this.pool = res[0];
        if (res[0]) {
          // if pool is passphrase protected, abled passphrase field.
          if (res[0].encrypt === 2) {
            [this.replaceDiskFormFields, this.extendVdevFormFields].forEach(formFields => {
              _.find(formFields, { name: 'passphrase' })['isHidden'] = false;
              _.find(formFields, { name: 'passphrase' }).disabled = false;
              _.find(formFields, { name: 'passphrase2' })['isHidden'] = false;
              _.find(formFields, { name: 'passphrase2' }).disabled = false;
            })
          }
          this.poolScan = res[0].scan;
          // subscribe zfs.pool.scan to get scrub job info
          if (this.poolScan.state == 'SCANNING') {
            this.getZfsPoolScan(res[0].name);
          }
          this.dataHandler(res[0]);
        }
      },
      (err) => {
        new EntityUtils().handleError(this, err);
      }
    );
  }

  getUnusedDisk() {
    const availableDisks = [];
    const availableDisksForExtend = [];
    this.ws.call('disk.get_unused').subscribe((res) => {
      for (const i in res) {
        availableDisks.push({
          label: res[i].devname,
          value: res[i].identifier,
        });
        availableDisksForExtend.push({
          label: res[i].devname + ' (' + (<any>window).filesize(res[i].size, { standard: 'iec' }) + ')',
          value: res[i].name,
        });
      }
      _.find(this.replaceDiskFormFields, { name: 'disk' }).options = availableDisks;
      _.find(this.extendVdevFormFields, { name: 'new_disk' }).options = availableDisksForExtend;
    })
  }

  ngOnInit() {

    //Setup Global Actions
    const actionId = 'refreshBtn'
    this.actionEvents = new Subject();
    this.actionEvents.subscribe((evt) => {
      if(evt.data[actionId]){
        this.refresh();
      }
    });

    const toolbarConfig: ToolbarConfig = {
      target: this.actionEvents,
      controls: [
        {
          type: 'button',
          name: actionId,
          label: 'Refresh',
          color: 'primary'
        }
      ]
    };

    const actionsConfig = { actionType:EntityToolbarComponent, actionConfig: toolbarConfig };
    this.core.emit({name:"GlobalActions", data: actionsConfig, sender: this });


    this.aroute.params.subscribe(params => {
      this.pk = parseInt(params['pk'], 10);
      this.getData();
    });

    this.getUnusedDisk();
  }

  ngOnDestroy(){
    this.actionEvents.complete();
    this.core.unregister({observerClass: this});
  }

  refresh() {
    this.loader.open();
    this.getData();
    this.loader.close();
  }

  getAction(data, category, vdev_type): any {
    const actions = [{
      id: 'edit',
      label: helptext.actions_label.edit,
      onClick: (row) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.ws.call('disk.query', [
          [
            ["devname", "=", diskName]
          ]
        ]).subscribe((res) => {
          this.onClickEdit(res[0].identifier);
        })
      },
      isHidden: false,
    }, {
      id: 'offline',
      label: helptext.actions_label.offline,
      onClick: (row) => {
        let name = row.name;
        // if use path as name, show the full path
        if (!_.startsWith(name, '/')) {
          const pIndex = name.lastIndexOf('p');
          name = pIndex > -1 ? name.substring(0, pIndex) : name;
        }
        this.dialogService.confirm(
          helptext.offline_disk.title,
          helptext.offline_disk.message + name + "?" + (this.pool.encrypt == 0 ? '' : helptext.offline_disk.encryptPoolWarning),
          false,
          helptext.offline_disk.buttonMsg
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            const value = { label: row.guid };
            this.ws.call('pool.offline', [this.pk, value]).subscribe(
              (res) => {
                this.getData();
                this.loader.close();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
              }
            )
          }
        })
      },
      isHidden: data.status == "OFFLINE" ? true : false,
    }, {
      id: 'online',
      label: helptext.actions_label.online,
      onClick: (row) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.dialogService.confirm(
          helptext.online_disk.title,
          helptext.online_disk.message + diskName + "?",
          false,
          helptext.online_disk.buttonMsg,
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            let value = { label: row.guid };
            this.ws.call('pool.online', [this.pk, value]).subscribe(
              (res) => {
                this.getData();
                this.loader.close();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
              }
            )
          }
        });
      },
      isHidden: data.status == "ONLINE" || this.pool.encrypt !== 0 ? true : false,
    }, {
      id: 'replace',
      label: helptext.actions_label.replace,
      onClick: (row) => {
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
          customSubmit: function (entityDialog: any) {
            delete entityDialog.formValue['passphrase2'];

            const dialogRef = entityDialog.parent.matDialog.open(EntityJobComponent, {data: {"title": helptext.replace_disk.title}, disableClose: true});
            dialogRef.componentInstance.setDescription(helptext.replace_disk.description);
            dialogRef.componentInstance.setCall('pool.replace', [pk, entityDialog.formValue]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.subscribe(res=>{
              dialogRef.close(true);
              entityDialog.dialogRef.close(true);
              entityDialog.parent.getData();
              entityDialog.parent.getUnusedDisk();
              entityDialog.parent.dialogService.Info(helptext.replace_disk.title, helptext.replace_disk.info_dialog_content + name + ".", '', 'info', true);
            }),
            dialogRef.componentInstance.failure.subscribe((res) => {
              dialogRef.close();
              entityDialog.dialogRef.close();
              let err = helptext.replace_disk.err_msg;
              if (res.error.startsWith('[EINVAL]')) {
                err = res.error;
              }
              entityDialog.parent.dialogService.errorReport(helptext.replace_disk.err_title, err, res.exception);
            });
          }
        }
        this.dialogService.dialogForm(conf);
      },
      isHidden: false,
    }, {
      id: 'remove',
      label: helptext.actions_label.remove,
      onClick: (row) => {
        let diskName = row.name;
        if (!_.startsWith(row.name, '/')) {
          const pIndex = row.name.lastIndexOf('p');
          diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;
        }

        this.dialogService.confirm(
          helptext.remove_disk.title,
          helptext.remove_disk.message + diskName + "?",
          false,
          helptext.remove_disk.buttonMsg
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            this.ws.call('pool.remove', [this.pk, {label: row.guid}]).subscribe(
              (res) => {
                this.getData();
                this.loader.close();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
              }
            )
          };
        });
      },
      isHidden: false,
    }, {
      id: 'detach',
      label: helptext.actions_label.detach,
      onClick: (row) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.dialogService.confirm(
          helptext.detach_disk.title,
          helptext.detach_disk.message + diskName + "?",
          false,
          helptext.detach_disk.buttonMsg
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            this.ws.call('pool.detach', [this.pk, {label: row.guid}]).subscribe(
              (res) => {
                this.getData();
                this.getUnusedDisk();
                this.loader.close();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
              }
            )
          };
        });
      },
      isHidden: true,
    }];

    if (category == "data") {
      _.find(actions, { id: "remove" }).isHidden = true;
    } else if (category == "spares") {
      _.find(actions, { id: "online" }).isHidden = true;
      _.find(actions, { id: "offline" }).isHidden = true;
      _.find(actions, { id: "Replace" }).isHidden = true;
    } else if (category == "cache") {
      _.find(actions, { id: "online" }).isHidden = true;
      _.find(actions, { id: "offline" }).isHidden = true;
    }

    if (vdev_type === "MIRROR" || vdev_type === "REPLACING" || vdev_type === "SPARE") {
      _.find(actions, { id: "detach" }).isHidden = false;
    }

    if (vdev_type === "MIRROR") {
      _.find(actions, { id: "remove" }).isHidden = true;
    }

    return actions;
  }

  extendAction(data) {
    return [{
      id: 'extend',
      label: helptext.actions_label.extend,
      onClick: (row) => {
        const pk = this.pk;
        _.find(this.extendVdevFormFields, { name: 'target_vdev' }).value = row.guid;
        const conf: DialogFormConfiguration = {
          title: helptext.extend_disk.form_title,
          fieldConfig: this.extendVdevFormFields,
          saveButtonText: helptext.extend_disk.saveButtonText,
          parent: this,
          customSubmit: function (entityDialog: any) {
            delete entityDialog.formValue['passphrase2'];

            const dialogRef = entityDialog.parent.matDialog.open(EntityJobComponent, {data: {"title": helptext.extend_disk.title}, disableClose: true});
            dialogRef.componentInstance.setDescription(helptext.extend_disk.description);
            dialogRef.componentInstance.setCall('pool.attach', [pk, entityDialog.formValue]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.subscribe(res=>{
              dialogRef.close(true);
              entityDialog.dialogRef.close(true);
              entityDialog.parent.getData();
              entityDialog.parent.getUnusedDisk();
              entityDialog.parent.dialogService.Info(helptext.extend_disk.title, helptext.extend_disk.info_dialog_content + name + ".", '', 'info', true);
            }),
            dialogRef.componentInstance.failure.subscribe((res) => {
              dialogRef.close();
              entityDialog.dialogRef.close();
              let err = helptext.extend_disk.err_msg;
              if (res.error.startsWith('[EINVAL]')) {
                err = res.error;
              }
              entityDialog.parent.dialogService.errorReport(helptext.extend_disk.err_title, err, res.exception);
            });
          }
        }
        this.dialogService.dialogForm(conf);

      }
    }, {
      id: 'Remove',
      label: helptext.actions_label.remove,
      onClick: (row) => {
        let diskName = row.name;
        if (!_.startsWith(row.name, '/')) {
          const pIndex = row.name.lastIndexOf('p');
          diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;
        }

        this.dialogService.confirm(
          helptext.remove_disk.title,
          helptext.remove_disk.message + diskName + "?",
          false,
          helptext.remove_disk.buttonMsg
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            this.ws.call('pool.remove', [this.pk, {label: row.guid}]).subscribe(
              (res) => {
                this.getData();
                this.loader.close();
              },
              (err) => {
                this.loader.close();
                new EntityUtils().handleWSError(this, err, this.dialogService);
              }
            )
          };
        });
      }
    }];
  }

  parseData(data: any, category?: any, vdev_type?: any) {
    let stats: any = {
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
    };

    if (data.stats) {
      stats = data.stats;
    }
    if (data.type && data.type != 'DISK') {
      data.name = data.type;
    }
    // use path as the device name if the device name is null
    if (!data.disk || data.disk == null) {
      data.disk = data.path;
    }

    const item: poolDiskInfo = {
      name: data.name ? data.name : data.disk,
      read: stats.read_errors ? stats.read_errors : 0,
      write: stats.write_errors ? stats.write_errors : 0,
      checksum: stats.checksum_errors ? stats.checksum_errors : 0,
      status: data.status,
      path: data.path,
      guid: data.guid,
    };

    // add actions
    if (category && data.type) {
      if (data.type == 'DISK') {
        item.actions = [{title:'Disk Actions', actions: this.getAction(data, category, vdev_type)}];
      } else if (data.type === 'MIRROR') {
        item.actions = [{title: 'Mirror Actions', actions: this.extendAction(data)}];
      }
    }
    return item;
  }

  parseTopolgy(data: any, category: any, vdev_type?: any): TreeNode {
    const node: TreeNode = {};
    node.data = this.parseData(data, category, vdev_type);
    node.expanded = true;
    node.children = [];

    if (data.children) {
      if (data.children.length === 0 && vdev_type === undefined) {
        const extend_action = this.extendAction(data);
        node.data.actions.push(extend_action[0]);
      }
      vdev_type = data.name;
      for (let i = 0; i < data.children.length; i++) {
        node.children.push(this.parseTopolgy(data.children[i], category, vdev_type));
      }
    }
    delete node.data.children;
    return node;
  }

  dataHandler(pool: any) {
    const node: TreeNode = {};
    node.data = this.parseData(pool);
    node.expanded = true;
    node.children = [];

    for (const category in pool.topology) {
      const topoNode: TreeNode = {};
      topoNode.data = {
        name: category
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
      columns: [...this.treeTableConfig.columns]
    };
  }

  getReadableDate(data: any) {
    if (data != null) {
      return this.localeService.formatDateTime(new Date(data.$date));
    }
    return;
  }

  onClickEdit(pk) {
    let diskForm = new DiskFormComponent(this.router, this.rest, this.ws, this.aroute);
    diskForm.inIt(pk);
    this.modalService.open('slide-in-form', diskForm);
  }
}
