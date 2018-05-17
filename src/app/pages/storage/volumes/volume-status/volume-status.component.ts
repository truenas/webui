import { Component, OnInit } from '@angular/core';
import { WebSocketService } from "../../../../services/ws.service";
import { ActivatedRoute, Params } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';

interface poolDiskInfo {
  id: number,
  parentId: number,
  name: any,
  read: any,
  write: any,
  checksum: any,
  status: any,
}

@Component({
  selector: 'volume-status',
  templateUrl: './volume-status.component.html',
  styleUrls: ['./volume-status.component.css'],
})
export class VolumeStatusComponent implements OnInit {

  public poolScan: any;
  public topology: Array<poolDiskInfo> = [];
  protected pk: any;
  public expandRows: Array<number> = [1];

  constructor(protected aroute: ActivatedRoute,
    protected ws: WebSocketService,
    protected translate: TranslateService) {}

  ngOnInit() {
    this.aroute.params.subscribe(params => {
      this.pk = params['pk'];
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
          console.log(res[0]);
        },
        (err) => {
          console.log(err);
        });
    });
  }

  parseResponse(id: any, data: any, parentId: any) {
    let stats: any = {
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
    };

    if (data.stats) {
      stats = data.stats;
    }

    // use path as the name till we can get name from ws call
    if (!data.name) {
      data.name = data.path;
    }

    const item: poolDiskInfo = {
      id: id,
      parentId: parentId,
      name: data.name,
      read: stats.read_errors ? stats.read_errors : 0,
      write: stats.write_errors ? stats.write_errors : 0,
      checksum: stats.checksum_errors ? stats.checksum_errors : 0,
      status: data.status,
    };
    this.topology.push(item);
  }

  dataHandler(pool: any) {
    this.parseResponse(1, pool, 0);
    if (pool.topology.data) {
      for (let i in pool.topology.data) {
        let rowId = this.topology.length + 1;
        this.expandRows.push(rowId);
        this.topology.push(
          {
            id: rowId,
            parentId: 1,
            name: pool.topology.data[i].type + '-' + i,
            read: pool.topology.data[i].stats.read_errors,
            write: pool.topology.data[i].stats.write_errors,
            checksum: pool.topology.data[i].stats.write_errors,
            status: pool.topology.data[i].status,
          });

        if (pool.topology.data[i].children) {
          for (let j in pool.topology.data[i].children) {
            this.parseResponse(this.topology.length + 1, pool.topology.data[i].children[j], rowId);
          }
        }
        if (pool.topology.data[i].path != null) {
            this.parseResponse(this.topology.length + 1, pool.topology.data[i], rowId);
        }
      }
    }
    console.log(this.topology);
  }

  getReadableDate(data: any) {
    return new Date(data.$date);
  }
}
