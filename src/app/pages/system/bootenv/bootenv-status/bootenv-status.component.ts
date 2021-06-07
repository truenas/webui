import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TreeNode } from 'primeng/api';
import { EntityTreeTable } from 'app/pages/common/entity/entity-tree-table/entity-tree-table.model';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';
import { T } from 'app/translate-marker';

interface PoolDiskInfo {
  name: any;
  read: any;
  write: any;
  checksum: any;
  status: any;
  actions?: any;
  path?: any;
}

@UntilDestroy()
@Component({
  selector: 'app-bootstatus-list',
  templateUrl: './bootenv-status.component.html',
})
export class BootStatusListComponent implements OnInit {
  title = 'Boot Pool Status';
  protected queryCall = 'boot.get_state';
  protected entityList: any;
  protected pk: number;
  poolScan: any;
  oneDisk = false;
  expandRows: number[] = [1];
  treeTableConfig: EntityTreeTable = {
    tableData: [],
    columns: [
      { name: 'Name', prop: 'name' },
      { name: 'Read', prop: 'read' },
      { name: 'Write', prop: 'write' },
      { name: 'Checksum', prop: 'checksum' },
      { name: 'Status', prop: 'status' },
    ],
  };

  constructor(
    private _router: Router,
    private ws: WebSocketService,
    private dialog: DialogService,
    protected loader: AppLoaderService,
    protected aroute: ActivatedRoute,
  ) {}

  getData(): void {
    this.ws.call('boot.get_state').pipe(untilDestroyed(this)).subscribe(
      (res) => {
        if (res.groups.data[0].type === 'disk') {
          this.oneDisk = true;
        }
        if (res) {
          // this.poolScan = res.scan;
          this.dataHandler(res);
        }
      },
      (err) => {
        new EntityUtils().handleError(this, err);
      },
    );
  }

  ngOnInit(): void {
    this.aroute.params.pipe(untilDestroyed(this)).subscribe((params) => {
      this.pk = parseInt(params['pk'], 10);
      this.getData();
    });
  }

  detach(disk: any): void {
    disk = disk.substring(5, disk.length);
    this.loader.open();
    this.ws.call('boot.detach', [disk]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this._router.navigate(
          new Array('').concat('system', 'boot'),
        );
        this.dialog.Info(T('Device detached '), T(`<i>${disk}</i> has been detached.`), '300px', 'info', true);
      },
      (res) => {
        this.loader.close();
        this.dialog.errorReport(res.error, res.reason, res.trace.formatted);
      },
    );
  }

  parseData(data: any, category?: any, boot_pool_data?: any): any {
    let stats: any = {
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
    };

    if (data.stats) {
      stats = data.stats;
    }
    if (data.type && data.type != 'disk') {
      data.name = data.type;
    }
    // use path as the device name if the device name is null
    if (!data.device || data.device == null) {
      data.device = data.path;
    }

    const item: PoolDiskInfo = {
      name: data.name ? data.name : data.device,
      read: stats.read_errors ? stats.read_errors : 0,
      write: stats.write_errors ? stats.write_errors : 0,
      checksum: stats.checksum_errors ? stats.checksum_errors : 0,
      status: data.status,
      path: data.path,
    };

    if (data.type && boot_pool_data && boot_pool_data.type === 'mirror' && data.path) {
      item.actions = [{
        label: T('Detach'),
        onClick: (row: any) => {
          this.detach(row.name);
        },
        isHidden: false,
      },
      {
        label: T('Replace'),
        onClick: (row: any) => {
          this._router.navigate(new Array('').concat(['system', 'boot', 'replace', row.name]));
        },
        isHidden: false,
      }];
    }

    if (data.type && boot_pool_data && boot_pool_data.type === 'disk' && data.path && !this.oneDisk) {
      item.actions = [
        {
          label: T('Replace'),
          onClick: (row: any) => {
            this._router.navigate(new Array('').concat(['system', 'boot', 'replace', row.name]));
          },
          isHidden: false,
        }];
    }

    if (data.type && boot_pool_data && boot_pool_data.type === 'disk' && data.path && this.oneDisk) {
      item.actions = [
        {
          label: T('Attach'),
          onClick: (row: any) => {
            this._router.navigate(new Array('').concat(['system', 'boot', 'attach', row.name]));
          },
          isHidden: false,
        },
        {
          label: T('Replace'),
          onClick: (row: any) => {
            this._router.navigate(new Array('').concat(['system', 'boot', 'replace', row.name]));
          },
          isHidden: false,
        }];
    }

    return item;
  }

  parseTopolgy(data: any, category: any, parent?: any): TreeNode {
    const node: TreeNode = {};
    node.data = this.parseData(data, category, parent);
    node.expanded = true;
    node.children = [];

    if (data.children) {
      for (let i = 0; i < data.children.length; i++) {
        node.children.push(this.parseTopolgy(data.children[i], category, parent));
      }
    }
    delete node.data.children;
    return node;
  }

  dataHandler(pool: any): void {
    this.treeTableConfig.tableData = [];
    const node: TreeNode = {};
    node.data = this.parseData(pool);
    node.expanded = true;
    node.children = [];

    for (let i = 0; i < pool.groups.data.length; i++) {
      node.children.push(this.parseTopolgy(pool.groups.data[i], 'data', pool.groups.data[i]));
    }

    delete node.data.children;
    const config = { ...this.treeTableConfig };
    config.tableData = [node];
    this.treeTableConfig = config;
  }

  getReadableDate(data: any): Date {
    if (data != null) {
      return new Date(data.$date);
    }
  }
}
