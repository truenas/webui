import { Component, OnInit } from '@angular/core';
import { WebSocketService, RestService, AppLoaderService, DialogService } from "../../../../services";
import { ActivatedRoute, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { TreeNode } from 'primeng/api';
import { EntityTreeTable } from '../../../common/entity/entity-tree-table/entity-tree-table.model';

import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { MatSnackBar, MatDialog } from '@angular/material';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../translate-marker';
import { EntityJobComponent } from '../../../common/entity/entity-job/entity-job.component';

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

  public poolScan: any;
  public treeTableConfig: EntityTreeTable = {
    tableData: [],
    columns: [
      { name: 'Name', prop: 'name', },
      { name: 'Read', prop: 'read', },
      { name: 'Write', prop: 'write', },
      { name: 'Checksum', prop: 'checksum', },
      { name: 'Status', prop: 'status', },
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
    placeholder: "Member disk",
    options: [],
    required: true,
    validation: [Validators.required],
  }, {
    type: 'input',
    inputType: 'password',
    name: 'passphrase',
    placeholder: T('Passphrase'),
    required: true,
    isHidden: true,
    disabled: true,
  }, {
    type: 'input',
    inputType: 'password',
    name: 'passphrase2',
    placeholder: T('Confirm Passphrase'),
    validation : [ matchOtherValidator('passphrase') ],
    required: true,
    isHidden: true,
    disabled: true,
  }, {
    type: 'checkbox',
    name: 'force',
    placeholder: "Force",
  }];

  protected pool: any;

  constructor(protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected rest: RestService,
    protected translate: TranslateService,
    protected router: Router,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected snackBar: MatSnackBar,
    protected matDialog: MatDialog) {}

  getZfsPoolScan(poolName) {
    this.ws.subscribe('zfs.pool.scan').subscribe(
      (res) => {
        if (res.fields && res.fields.name == poolName) {
          this.poolScan = res.fields.scan;
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
            _.find(this.replaceDiskFormFields, { name: 'passphrase' })['isHidden'] = false;
            _.find(this.replaceDiskFormFields, { name: 'passphrase' }).disabled = false;
            _.find(this.replaceDiskFormFields, { name: 'passphrase2' })['isHidden'] = false;
            _.find(this.replaceDiskFormFields, { name: 'passphrase2' }).disabled = false;
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
    this.ws.call('disk.get_unused').subscribe((res) => {
      for (const i in res) {
        availableDisks.push({
          label: res[i].devname,
          value: res[i].identifier,
        })
      }
      _.find(this.replaceDiskFormFields, { name: 'disk' }).options = availableDisks;
    })
  }
  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.pk = parseInt(params['pk']);
      this.getData();
    });
    this.getUnusedDisk();
  }

  getAction(data, category): any {
    const actions = [{
      label: "Edit",
      onClick: (row) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.ws.call('disk.query', [
          [
            ["devname", "=", diskName]
          ]
        ]).subscribe((res) => {
          this.editDiskRoute.push(this.pk, "edit", res[0].identifier);
          this.router.navigate(new Array('').concat(this.editDiskRoute));
        })
      },
      isHidden: false,
    }, {
      label: T("Offline"),
      onClick: (row) => {
        const encryptPoolWarning = T('<br><b>Warning: Disks cannot be onlined in encrypted pools.</b></br>');

        let name = row.name;
        // if use path as name, show the full path
        if (!_.startsWith(name, '/')) {
          const pIndex = name.lastIndexOf('p');
          name = pIndex > -1 ? name.substring(0, pIndex) : name;
        }
        this.dialogService.confirm(
          "Offline",
          "Offline disk " + name + "?" + (this.pool.encrypt == 0 ? '' : encryptPoolWarning), false, T('Offline')
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
      label: "Online",
      onClick: (row) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.dialogService.confirm(
          "Online",
          "Online disk " + diskName + "?", false, T('Online')
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
      label: "Replace",
      onClick: (row) => {
        let name = row.name;
        if (!_.startsWith(name, '/')) {
          const pIndex = name.lastIndexOf('p');
          name = pIndex > -1 ? name.substring(0, pIndex) : name;
        }
        const pk = this.pk;
        _.find(this.replaceDiskFormFields, { name: 'label' }).value = row.guid;

        const conf: DialogFormConfiguration = {
          title: "Replacing disk " + name,
          fieldConfig: this.replaceDiskFormFields,
          saveButtonText: "Replace Disk",
          parent: this,
          customSubmit: function (entityDialog: any) {
            delete entityDialog.formValue['passphrase2'];

            const dialogRef = entityDialog.parent.matDialog.open(EntityJobComponent, {data: {"title":"Replacing Disk"}, disableClose: true});
            dialogRef.componentInstance.setDescription(T("Replacing disk..."));
            dialogRef.componentInstance.setCall('pool.replace', [pk, entityDialog.formValue]);
            dialogRef.componentInstance.submit();
            dialogRef.componentInstance.success.subscribe(res=>{
              dialogRef.close(true);
              entityDialog.dialogRef.close(true);
              entityDialog.parent.getData();
              entityDialog.parent.getUnusedDisk();
              entityDialog.parent.snackBar.open("Successfully replaced disk " + name + ".", 'close', { duration: 5000 });
            }),
            dialogRef.componentInstance.failure.subscribe((res) => {
              if (res.error.startsWith('[EINVAL]')) {
                dialogRef.close();
                new EntityUtils().handleWSError(this, res.exc_info);
              }
            });
          }
        }
        this.dialogService.dialogForm(conf);
      },
      isHidden: false,
    }, {
      label: "Remove",
      onClick: (row) => {
        const pIndex = row.name.lastIndexOf('p');
        const diskName = pIndex > -1 ? row.name.substring(0, pIndex) : row.name;

        this.dialogService.confirm(
          "Remove",
          "Remove disk " + diskName + "?", false, T('Remove')
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
    }];

    if (category == "data") {
      _.find(actions, { label: "Remove" }).isHidden = true;
    } else if (category == "spares") {
      _.find(actions, { label: "Online" }).isHidden = true;
      _.find(actions, { label: "Offline" }).isHidden = true;
      _.find(actions, { label: "Replace" }).isHidden = true;
    } else if (category == "cache") {
      _.find(actions, { label: "Online" }).isHidden = true;
      _.find(actions, { label: "Offline" }).isHidden = true;
    }

    return actions;
  }

  parseData(data: any, category?: any) {
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
    if (!data.device || data.device == null) {
      data.device = data.path;
    }

    const item: poolDiskInfo = {
      name: data.name ? data.name : data.device,
      read: stats.read_errors ? stats.read_errors : 0,
      write: stats.write_errors ? stats.write_errors : 0,
      checksum: stats.checksum_errors ? stats.checksum_errors : 0,
      status: data.status,
      path: data.path,
      guid: data.guid,
    };

    // add actions
    if (category && data.type && data.type == 'DISK') {
      item.actions = this.getAction(data, category);
    }
    return item;
  }

  parseTopolgy(data: any, category: any): TreeNode {
    const node: TreeNode = {};
    node.data = this.parseData(data, category);
    node.expanded = true;
    node.children = [];

    if (data.children) {
      for (let i = 0; i < data.children.length; i++) {
        node.children.push(this.parseTopolgy(data.children[i], category));
      }
    }
    delete node.data.children;
    return node;
  }

  dataHandler(pool: any) {
    this.treeTableConfig.tableData = [];
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
    this.treeTableConfig.tableData.push(node);
  }

  getReadableDate(data: any) {
    if (data != null) {
      return new Date(data.$date);
    }
    return;
  }
}
