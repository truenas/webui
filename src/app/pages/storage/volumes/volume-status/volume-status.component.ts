import { Component, OnInit } from '@angular/core';
import { WebSocketService, RestService, AppLoaderService, DialogService } from "../../../../services";
import { ActivatedRoute, Params, Router } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';
import { FieldConfig } from '../../../common/entity/entity-form/models/field-config.interface';
import * as _ from 'lodash';
import { DialogFormConfiguration } from '../../../common/entity/entity-dialog/dialog-form-configuration.interface';
import { MatSnackBar } from '@angular/material';
import { Validators } from '@angular/forms';
import { T } from '../../../../translate-marker';

interface poolDiskInfo {
  id: number,
  parentId: number,
  name: any,
  read: any,
  write: any,
  checksum: any,
  status: any,
  actions ? : any,
  path ? : any,
}

@Component({
  selector: 'volume-status',
  templateUrl: './volume-status.component.html',
  styleUrls: ['./volume-status.component.css']
})
export class VolumeStatusComponent implements OnInit {

  public poolScan: any;
  public topology: Array < poolDiskInfo > = [];
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

  getData() {
    this.ws.call('pool.query', [
      [
        ["id", "=", this.pk]
      ]
    ]).subscribe(
      (res) => {
        if (res[0]) {
          this.poolScan = res[0].scan;
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

  parseResponse(id: any, data: any, parentId: any, category ? : any) {
    let stats: any = {
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
    };

    if (data.stats) {
      stats = data.stats;
    }

    // use path as the device name if the device name is null
    if (!data.device || data.device == null) {
      data.device = data.path;
    }

    const item: poolDiskInfo = {
      id: id,
      parentId: parentId,
      name: data.name ? data.name : data.device,
      read: stats.read_errors ? stats.read_errors : 0,
      write: stats.write_errors ? stats.write_errors : 0,
      checksum: stats.checksum_errors ? stats.checksum_errors : 0,
      status: data.status,
      path: data.path,
    };

    // add actions
    if (data.type && data.type == 'DISK') {
      item.actions = [{
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
      if (category) {
        if (category == "data") {
          _.find(item.actions, { label: "Remove" }).isHidden = true;
        } else if (category == "spares") {
          _.find(item.actions, { label: "Online" }).isHidden = true;
          _.find(item.actions, { label: "Offline" }).isHidden = true;
          _.find(item.actions, { label: "Replace" }).isHidden = true;
        } else if (category == "cache") {
          _.find(item.actions, { label: "Online" }).isHidden = true;
          _.find(item.actions, { label: "Offline" }).isHidden = true;
        }
      }
    }

    this.topology.push(item);
  }

  parseTopology(data, parentRow: any) {
    let parentId = 1;
    let namePostfix: boolean = false;
    if (parentRow && parentRow != 'data' && data.length > 0) {
      parentId = this.topology.length + 1;
      this.topology.push({
        id: this.topology.length + 1,
        parentId: 1,
        name: parentRow,
        read: '',
        write: '',
        checksum: '',
        status: '',
      });
      this.expandRows.push(parentId);
    }
    if (data.length > 1) {
      namePostfix = true;
    }
    for (let i in data) {
      let subParentId = parentId;
      if (data[i].type != 'DISK') {
        let rowId = this.topology.length + 1;
        this.expandRows.push(rowId);
        this.topology.push({
          id: rowId,
          parentId: parentId,
          name: namePostfix ? data[i].type + '-' + i : data[i].type,
          read: data[i].stats.read_errors,
          write: data[i].stats.write_errors,
          checksum: data[i].stats.write_errors,
          status: data[i].status,
        });
        subParentId = rowId;
      }
      if (data[i].children) {
        for (let j in data[i].children) {
          this.parseResponse(this.topology.length + 1, data[i].children[j], subParentId, parentRow);
        }
      }
      if (data[i].path != null) {
        this.parseResponse(this.topology.length + 1, data[i], subParentId, parentRow);
      }
    }
  }

  dataHandler(pool: any) {
    this.topology = [];
    this.parseResponse(1, pool, 0);
    this.parseTopology(pool.topology.data, 'data');
    this.parseTopology(pool.topology.log, 'logs');
    this.parseTopology(pool.topology.cache, 'cache');
    this.parseTopology(pool.topology.spare, 'spares');

  }

  getReadableDate(data: any) {
    if (data != null) {
      return new Date(data.$date);
    }
    return;
  }
}
