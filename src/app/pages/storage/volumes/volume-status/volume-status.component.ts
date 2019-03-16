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
import { MatSnackBar } from '@angular/material';
import { Validators } from '@angular/forms';
import { matchOtherValidator } from '../../../common/entity/entity-form/validators/password-validation';
import { T } from '../../../../translate-marker';

interface poolDiskInfo {
  name: any,
  read: any,
  write: any,
  checksum: any,
  status: any,
  actions ?: any,
  path ?: any,
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

  protected availableDisks: Array < any > = [];
  protected replaceDiskFormFields: FieldConfig[] = [{
    type: 'input',
    name: 'label',
    value: '',
    isHidden: true,
  }, {
    type: 'select',
    name: 'replace_disk',
    placeholder: "Member disk",
    options: [],
    required: true,
    validation: [Validators.required],
  }, {
    type: 'input',
    inputType: 'password',
    name: 'pass',
    placeholder: T('Passphrase'),
    required: true,
    isHidden: true,
    disabled: true,
  }, {
    type: 'input',
    inputType: 'password',
    name: 'pass2',
    placeholder: T('Confirm Passphrase'),
    validation : [ matchOtherValidator('pass') ],
    required: true,
    isHidden: true,
    disabled: true,
  }, {
    type: 'checkbox',
    name: 'force',
    placeholder: "Force",
  }];

  constructor(protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected rest: RestService,
    protected translate: TranslateService,
    protected router: Router,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected snackBar: MatSnackBar) {}

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
        if (res[0]) {
          // if pool is passphrase protected, abled passphrase field.
          if (res[0].encrypt === 2) {
            _.find(this.replaceDiskFormFields, { name: 'pass' })['isHidden'] = false;
            _.find(this.replaceDiskFormFields, { name: 'pass' }).disabled = false;
            _.find(this.replaceDiskFormFields, { name: 'pass2' })['isHidden'] = false;
            _.find(this.replaceDiskFormFields, { name: 'pass2' }).disabled = false;
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

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.pk = parseInt(params['pk']);
      this.getData();
    });

    this.ws.call('disk.get_unused').subscribe((res) => {
      for (let i in res) {
        this.availableDisks.push({
          label: res[i].name,
          value: res[i].name,
        })
      }
      _.find(this.replaceDiskFormFields, { name: 'replace_disk' }).options = this.availableDisks;
    })
  }

  getAction(data, category): any {
    const actions = [{
      label: "Edit",
      onClick: (row) => {
        const diskName = _.split(row.name, 'p')[0];
        this.ws.call('disk.query', [
          [
            ["name", "=", diskName]
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
        let name = row.name;
        // if use path as name, show the full path
        if (!_.startsWith(name, '/')) {
          name = _.split(row.name, 'p')[0];
        }
        this.dialogService.confirm(
          "Offline",
          "Offline disk " + name + "?", false, T('Offline')
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            let value = { label: row.path };
            this.rest.post('storage/volume/' + this.pk + '/offline/', {
              body: JSON.stringify(value)
            }).subscribe(
              (res) => {
                this.getData();
                this.loader.close();
              },
              (res) => {
                this.loader.close();
                this.dialogService.errorReport("Error", res.error.error_message, res.error.traceback);
              }
            );
          }
        })
      },
      isHidden: data.status == "OFFLINE" ? true : false,
    }, {
      label: "Online",
      onClick: (row) => {
        this.dialogService.confirm(
          "Online",
          "Online disk " + _.split(row.name, 'p')[0] + "?", false, T('Online')
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            let value = { label: row.path };
            this.rest.post('storage/volume/' + this.pk + '/online/', {
              body: JSON.stringify(value)
            }).subscribe(
              (res) => {
                this.getData();
                this.loader.close();
              },
              (res) => {
                this.loader.close();
                this.dialogService.errorReport("Error", res.error.error_message, res.error.traceback);
              }
            );
          }
        });
      },
      isHidden: data.status == "ONLINE" ? true : false,
    }, {
      label: "Replace",
      onClick: (row) => {
        _.find(this.replaceDiskFormFields, { name: 'label' }).value = row.path;
        const conf: DialogFormConfiguration = {
          title: "Replacing disk " + _.split(row.name, 'p')[0],
          fieldConfig: this.replaceDiskFormFields,
          method_rest: "storage/volume/" + this.pk + "/replace",
          saveButtonText: "Replace Disk",
        }
        this.dialogService.dialogForm(conf).subscribe((res) => {
          if (res) {
            this.getData();
            this.snackBar.open("Disk replacement started.", 'close', { duration: 5000 });
          }
        });
      },
      isHidden: false,
    }, {
      label: "Remove",
      onClick: (row) => {
        this.dialogService.confirm(
          "Remove",
          "Remove disk " + _.split(row.name, 'p')[0] + "?", false, T('Remove')
        ).subscribe((res) => {
          if (res) {
            this.loader.open();
            let value = { label: row.path };
            this.rest.post('storage/volume/' + this.pk + '/remove/', {
              body: JSON.stringify(value)
            }).subscribe(
              (res) => {
                this.getData();
                this.loader.close();
              },
              (res) => {
                this.loader.close();
                this.dialogService.errorReport("Error", res.error.error_message, res.error.traceback);
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
