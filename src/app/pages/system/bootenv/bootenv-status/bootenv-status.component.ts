import { NestedTreeControl } from '@angular/cdk/tree';
import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import {
  MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatList, MatListItem } from '@angular/material/list';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { DeviceNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { NestedTreeNodeComponent } from 'app/modules/ix-tree/components/nested-tree-node/nested-tree-node.component';
import { TreeNodeComponent } from 'app/modules/ix-tree/components/tree-node/tree-node.component';
import { TreeViewComponent } from 'app/modules/ix-tree/components/tree-view/tree-view.component';
import { TreeNodeDefDirective } from 'app/modules/ix-tree/directives/tree-node-def.directive';
import { TreeNodeOutletDirective } from 'app/modules/ix-tree/directives/tree-node-outlet.directive';
import { TreeNodeToggleDirective } from 'app/modules/ix-tree/directives/tree-node-toggle.directive';
import { NestedTreeDataSource } from 'app/modules/ix-tree/nested-tree-datasource';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { BootPoolAttachDialogComponent } from 'app/pages/system/bootenv/boot-pool-attach/boot-pool-attach-dialog.component';
import { BootPoolReplaceDialogComponent } from 'app/pages/system/bootenv/boot-pool-replace/boot-pool-replace-dialog.component';
import { bootEnvStatusElements } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { BootenvNodeItemComponent } from './bootenv-node-item/bootenv-node-item.component';

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
  selector: 'ix-bootenv-status',
  templateUrl: './bootenv-status.component.html',
  styleUrls: ['./bootenv-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    FakeProgressBarComponent,
    UiSearchDirective,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    MatList,
    MatListItem,
    BootenvNodeItemComponent,
    MatIconButton,
    TestDirective,
    IxIconComponent,
    TranslateModule,
    FormatDateTimePipe,
    AsyncPipe,
    TreeViewComponent,
    TreeNodeComponent,
    TreeNodeDefDirective,
    TreeNodeToggleDirective,
    NestedTreeNodeComponent,
    TreeNodeOutletDirective,
  ],
})
export class BootStatusListComponent implements OnInit {
  protected readonly searchableElements = bootEnvStatusElements;

  isLoading$ = new BehaviorSubject(false);
  dataSource: NestedTreeDataSource<DeviceNestedDataNode>;
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
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
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
      error: (error: unknown) => {
        this.isLoading$.next(false);
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  attach(): void {
    this.matDialog.open(BootPoolAttachDialogComponent)
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.loadPoolInstance());
  }

  replace(diskPath: string): void {
    this.matDialog.open(BootPoolReplaceDialogComponent, { data: diskPath })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.loadPoolInstance());
  }

  detach(diskPath: string): void {
    const disk = diskPath.substring(5, diskPath.length);
    this.ws.call('boot.detach', [disk])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.router.navigate(['/', 'system', 'boot']);
        this.snackbar.success(this.translate.instant('Device «{disk}» has been detached.', { disk }));
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

    this.dataSource = new NestedTreeDataSource<DeviceNestedDataNode>(dataNodes);
    this.treeControl.dataNodes = dataNodes;
  }

  private openGroupNodes(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
  }
}
