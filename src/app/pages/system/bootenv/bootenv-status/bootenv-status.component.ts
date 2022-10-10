import { NestedTreeControl } from '@angular/cdk/tree';
import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { DeviceNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { IxNestedTreeDataSource } from 'app/modules/ix-tree/ix-nested-tree-datasource';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { BootPoolAttachDialogComponent } from 'app/pages/system/bootenv/boot-pool-attach/boot-pool-attach-dialog.component';
import { BootPoolReplaceDialogComponent } from 'app/pages/system/bootenv/boot-pool-replace/boot-pool-replace-dialog.component';
import { DialogService } from 'app/services';
import { WebSocketService } from 'app/services/ws.service';

export enum BootPoolActionType {
  Replace = 'replace',
  Attach = 'attach',
  Detach = 'detach',
}
export interface BootPoolActionEvent {
  action: BootPoolActionType;
  node: TopologyItem;
}

@UntilDestroy()
@Component({
  templateUrl: './bootenv-status.component.html',
  styleUrls: ['./bootenv-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootStatusListComponent implements OnInit {
  isLoading$ = new BehaviorSubject(false);
  dataSource: IxNestedTreeDataSource<DeviceNestedDataNode>;
  treeControl = new NestedTreeControl<DeviceNestedDataNode, string>((vdev) => vdev.children, {
    trackBy: (vdev) => vdev.guid,
  });
  poolInstance: PoolInstance;
  readonly hasNestedChild = (_: number, node: DeviceNestedDataNode): boolean => {
    return Boolean(node?.children?.length);
  };

  get oneDisk(): boolean {
    if (!this.poolInstance) {
      return false;
    }
    return this.poolInstance.topology.data[0].type === TopologyItemType.Disk;
  }

  constructor(
    private router: Router,
    private ws: WebSocketService,
    private dialog: DialogService,
    private mdDialog: MatDialog,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadPoolInstance();
  }

  loadPoolInstance(): void {
    this.ws.call('boot.get_state').pipe(
      tap(() => this.isLoading$.next(true)),
      untilDestroyed(this),
    ).subscribe({
      next: (poolInstance) => {
        this.poolInstance = poolInstance;
        this.createDataSource(poolInstance);
        this.openGroupNodes();
        this.isLoading$.next(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading$.next(false);
        this.cdr.markForCheck();
        new EntityUtils().handleError(this, err);
      },
    });
  }

  attach(): void {
    this.mdDialog.open(BootPoolAttachDialogComponent)
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.loadPoolInstance());
  }

  replace(diskPath: string): void {
    this.mdDialog.open(BootPoolReplaceDialogComponent, { data: diskPath })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.loadPoolInstance());
  }

  detach(diskPath: string): void {
    const disk = diskPath.substring(5, diskPath.length);
    this.loader.open();
    this.ws.call('boot.detach', [disk]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.router.navigate(['/', 'system', 'boot']);
        this.dialog.info(
          this.translate.instant('Device detached'),
          this.translate.instant('<i>{disk}</i> has been detached.', { disk }),
        );
      },
      error: (error) => {
        this.loader.close();
        this.dialog.errorReport(error.error, error.reason, error.trace.formatted);
      },
    });
  }

  doAction(event: BootPoolActionEvent): void {
    switch (event.action) {
      case BootPoolActionType.Replace:
        this.replace(event.node.name);
        break;
      case BootPoolActionType.Attach:
        this.attach();
        break;
      case BootPoolActionType.Detach:
        this.detach(event.node.name);
        break;
      default:
        break;
    }
  }

  private createDataSource(poolInstance: PoolInstance): void {
    const dataNodes = [{
      ...poolInstance,
      guid: poolInstance.guid,
      group: poolInstance.name,
      children: poolInstance.topology.data,
    } as DeviceNestedDataNode];

    this.dataSource = new IxNestedTreeDataSource<DeviceNestedDataNode>(dataNodes);
    this.treeControl.dataNodes = dataNodes;
  }

  private openGroupNodes(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
  }
}
