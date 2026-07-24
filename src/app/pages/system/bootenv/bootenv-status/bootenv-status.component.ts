import { CdkTreeModule } from '@angular/cdk/tree';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnDialog,
  TnExpansionPanelComponent,
  TnListComponent,
  TnListItemComponent,
  TnNestedTreeDataSource,
  TnNestedTreeNodeComponent,
  TnTreeComponent,
  TnTreeExpansion,
  TnTreeNodeOutletDirective,
  createNestedTreeControl,
} from '@truenas/ui-components';
import { filter, tap } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { VDevNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { BootPoolAttachDialog } from 'app/pages/system/bootenv/boot-pool-attach/boot-pool-attach-dialog.component';
import { BootPoolReplaceDialog } from 'app/pages/system/bootenv/boot-pool-replace/boot-pool-replace-dialog.component';
import { bootEnvStatusElements } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { BootenvNodeItemComponent } from './bootenv-node-item/bootenv-node-item.component';

export enum BootPoolActionType {
  Replace = 'replace',
  Attach = 'attach',
  Detach = 'detach',
}
export interface BootPoolActionEvent {
  action: BootPoolActionType;
  node: VDevItem;
}

@Component({
  selector: 'ix-bootenv-status',
  templateUrl: './bootenv-status.component.html',
  styleUrls: ['./bootenv-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FakeProgressBarComponent,
    UiSearchDirective,
    TnExpansionPanelComponent,
    TnListComponent,
    TnListItemComponent,
    BootenvNodeItemComponent,
    TranslateModule,
    FormatDateTimePipe,
    CdkTreeModule,
    TnTreeComponent,
    TnNestedTreeNodeComponent,
    TnTreeNodeOutletDirective,
  ],
})
export class BootStatusListComponent implements OnInit {
  private router = inject(Router);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private tnDialog = inject(TnDialog);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = bootEnvStatusElements;

  protected isLoading = signal(false);
  protected dataSource: TnNestedTreeDataSource<VDevNestedDataNode>;
  protected treeControl: TnTreeExpansion<VDevNestedDataNode, string>
    = createNestedTreeControl<VDevNestedDataNode, string>(
      (vdev) => vdev.children,
      { trackBy: (vdev) => vdev.guid },
    );

  protected poolInstance: PoolInstance;
  protected readonly hasNestedChild = (_: number, node: VDevNestedDataNode): boolean => {
    return Boolean(node?.children?.length);
  };

  protected get oneDisk(): boolean {
    if (!this.poolInstance) {
      return false;
    }
    return this.poolInstance.topology.data[0].type === TopologyItemType.Disk;
  }

  ngOnInit(): void {
    this.loadPoolInstance();
  }

  private loadPoolInstance(): void {
    this.api.call('boot.get_state').pipe(
      tap(() => this.isLoading.set(true)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (poolInstance) => {
        this.poolInstance = poolInstance;
        this.createDataSource(poolInstance);
        this.openGroupNodes();
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  protected attach(): void {
    this.tnDialog.open(BootPoolAttachDialog)
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPoolInstance());
  }

  protected replace(diskPath: string): void {
    this.tnDialog.open(BootPoolReplaceDialog, { data: diskPath })
      .closed
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadPoolInstance());
  }

  protected detach(diskPath: string): void {
    const disk = diskPath.substring(5, diskPath.length);
    this.api.call('boot.detach', [disk])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.router.navigate(['/', 'system', 'boot']);
        this.snackbar.success(this.translate.instant('Device «{disk}» has been detached.', { disk }));
      });
  }

  protected doAction(event: BootPoolActionEvent): void {
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
    } as VDevNestedDataNode];

    this.dataSource = new TnNestedTreeDataSource<VDevNestedDataNode>(dataNodes);
    this.treeControl.dataNodes = dataNodes;
  }

  private openGroupNodes(): void {
    this.treeControl?.dataNodes?.forEach((node) => this.treeControl.expand(node));
  }
}
