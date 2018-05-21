import { Component, OnInit } from '@angular/core';
import { WebSocketService } from "../../../../services/ws.service";
import { ActivatedRoute, Params } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { EntityUtils } from '../../../common/entity/utils';

interface poolDiskInfo {
  id: number,
  parentId: number,
  name: any,
  read: any,
  write: any,
  checksum: any,
  status: any,
  actions?: any,
}

@Component({
  selector: 'volume-status',
  templateUrl: './volume-status.component.html',
  styleUrls: ['./volume-status.component.css']
})
export class VolumeStatusComponent implements OnInit {

  public poolScan: any;
  public topology: Array<poolDiskInfo> = [];
  protected pk: number;
  public expandRows: Array<number> = [1];

  constructor(protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService) {}

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.pk = parseInt(params['pk']);
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
        });
    });
  }

  parseResponse(id: any, data: any, parentId: any, category?: any) {
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
    };

    // add actions
    if (data.type && data.type == 'DISK') {
      item.actions = [{
        label: "Edit",
        onClick: (row) => {
          console.log("edit", row);
        }
      }];
      if (category) {
        if (category == "data") {
          item.actions.push({
            label: "Offline",
            onClick: (row) => {
              console.log("offline", row);
            }
          }, {
            label: "Replace",
            onClick: (row) => {
              console.log("replace", row);
            }
          });
        } else if (category == "cache" || category == "logs") {
          item.actions.push({
            label: "Offline",
            onClick: (row) => {
              console.log("offline", row);
            }
          }, {
            label: "Replace",
            onClick: (row) => {
              console.log("replace", row);
            }
          }, {
            label: "Remove",
            onClick: (row) => {
              console.log("remove", row);
            }
          });
        } else if (category == "spares") {
          item.actions.push({
            label: "Remove",
            onClick: (row) => {
              console.log("remove", row);
            }
          });
        }
      }
    }

    this.topology.push(item);
  }

  parseTopology(data, parentRow: any) {
    let parentId = 1;
    let namePostfix: boolean = false;
    if ( parentRow && parentRow != 'data' && data.length > 0) {
      parentId = this.topology.length + 1;
      this.topology.push(
        {
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
        this.topology.push(
          {
            id: rowId,
            parentId: parentId,
            name: namePostfix ? data[i].type + '-' + i : data[i].type,
            read: data[i].stats.read_errors,
            write: data[i].stats.write_errors,
            checksum: data[i].stats.write_errors,
            status: data[i].status,
          }
        );
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
