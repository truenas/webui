import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TreeNode } from 'primeng/api';
import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { BootPoolState } from 'app/interfaces/boot-pool-state.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { EntityTreeTable } from 'app/pages/common/entity/entity-tree-table/entity-tree-table.model';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { DialogService } from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { WebSocketService } from 'app/services/ws.service';
import { T } from 'app/translate-marker';

interface PoolDiskInfo {
  name: string;
  read: number;
  write: number;
  checksum: number;
  status: string;
  actions?: any;
  path?: string;
}

@UntilDestroy()
@Component({
  selector: 'app-bootstatus-list',
  templateUrl: './bootenv-status.component.html',
})
export class BootStatusListComponent implements OnInit {
  title = 'Boot Pool Status';
  protected queryCall: 'boot.get_state' = 'boot.get_state';
  protected pk: number;
  poolScan: {
    function: string;
    state: string;
    errors: string;
    start_time: ApiTimestamp;
    pause: boolean;
  };

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
      { name: T('Actions'), prop: 'actions' },
    ],
  };

  constructor(
    private router: Router,
    private ws: WebSocketService,
    private dialog: DialogService,
    protected loader: AppLoaderService,
    protected aroute: ActivatedRoute,
  ) {}

  getData(): void {
    this.ws.call('boot.get_state').pipe(untilDestroyed(this)).subscribe(
      (state) => {
        if (state.groups.data[0].type === 'disk') {
          this.oneDisk = true;
        }
        if (state) {
          this.dataHandler(state);
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

  detach(disk: string): void {
    disk = disk.substring(5, disk.length);
    this.loader.open();
    this.ws.call('boot.detach', [disk]).pipe(untilDestroyed(this)).subscribe(
      () => {
        this.loader.close();
        this.router.navigate(
          new Array('').concat('system', 'boot'),
        );
        this.dialog.info(T('Device detached '), T(`<i>${disk}</i> has been detached.`), '300px', 'info', true);
      },
      (res) => {
        this.loader.close();
        this.dialog.errorReport(res.error, res.reason, res.trace.formatted);
      },
    );
  }

  parseData(data: VDev | BootPoolState, category?: string, boot_pool_data?: VDev): PoolDiskInfo {
    let stats = {
      read_errors: 0,
      write_errors: 0,
      checksum_errors: 0,
    };

    if ('stats' in data) {
      stats = data.stats;
    }

    let name = (data as BootPoolState).name;
    if ('type' in data && data.type != 'disk') {
      name = data.type;
    }
    // use path as the device name if the device name is null
    if (!(data as VDev).device) {
      (data as VDev).device = (data as VDev).path;
    }

    const item: PoolDiskInfo = {
      name: name || (data as VDev).device,
      read: stats.read_errors ? stats.read_errors : 0,
      write: stats.write_errors ? stats.write_errors : 0,
      checksum: stats.checksum_errors ? stats.checksum_errors : 0,
      status: data.status,
      path: (data as VDev).path,
    };

    let actions: any[] = [];

    if ('type' in data && boot_pool_data && boot_pool_data.type === 'mirror' && data.path) {
      actions = [{
        id: 'edit',
        label: T('Detach'),
        onClick: (row: PoolDiskInfo) => {
          this.detach(row.name);
        },
        isHidden: false,
      },
      {
        label: T('Replace'),
        onClick: (row: PoolDiskInfo) => {
          this.router.navigate(new Array('').concat(['system', 'boot', 'replace', row.name]));
        },
        isHidden: false,
      }];
    }

    if ('type' in data && boot_pool_data && boot_pool_data.type === 'disk' && data.path && !this.oneDisk) {
      actions = [
        {
          label: T('Replace'),
          onClick: (row: PoolDiskInfo) => {
            this.router.navigate(new Array('').concat(['system', 'boot', 'replace', row.name]));
          },
          isHidden: false,
        }];
    }

    if ('type' in data && boot_pool_data && boot_pool_data.type === 'disk' && data.path && this.oneDisk) {
      actions = [
        {
          label: T('Attach'),
          onClick: (row: PoolDiskInfo) => {
            this.router.navigate(new Array('').concat(['system', 'boot', 'attach', row.name]));
          },
          isHidden: false,
        },
        {
          label: T('Replace'),
          onClick: (row: PoolDiskInfo) => {
            this.router.navigate(new Array('').concat(['system', 'boot', 'replace', row.name]));
          },
          isHidden: false,
        }];
    }

    if (actions.length) {
      item.actions = [{ actions, title: 'Actions' }];
    }

    return item;
  }

  parseTopology(data: VDev, category: string, parent?: VDev): TreeNode {
    const node: TreeNode = {};
    node.data = this.parseData(data, category, parent);
    node.expanded = true;
    node.children = [];

    if (data.children) {
      node.children = data.children.map((vdev) => {
        return this.parseTopology(vdev, category, parent);
      });
    }
    delete node.data.children;
    return node;
  }

  dataHandler(pool: BootPoolState): void {
    this.treeTableConfig.tableData = [];
    const node: TreeNode = {};
    node.data = this.parseData(pool);
    node.expanded = true;
    node.children = [];

    node.children = pool.groups.data.map((vdev) => {
      return this.parseTopology(vdev, 'data', vdev);
    });

    delete node.data.children;
    const config = { ...this.treeTableConfig };
    config.tableData = [node];
    this.treeTableConfig = config;
  }
}
