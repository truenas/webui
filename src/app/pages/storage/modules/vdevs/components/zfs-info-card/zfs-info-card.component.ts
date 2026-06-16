import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, output, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnCardComponent, TnDialog, type TnCardAction, type TnMenuItem } from '@truenas/ui-components';
import { filter, switchMap, tap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { VDevType, TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import {
  isTopologyDisk, VDevItem, VDev,
} from 'app/interfaces/storage.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ExtendDialog, ExtendDialogParams,
} from 'app/pages/storage/modules/vdevs/components/zfs-info-card/extend-dialog/extend-dialog.component';
import {
  RaidzExtendDialog, RaidzExtendDialogParams,
} from 'app/pages/storage/modules/vdevs/components/zfs-info-card/raidz-extend-dialog/raidz-extend-dialog.component';
import { VDevsStore } from 'app/pages/storage/modules/vdevs/stores/vdevs-store.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

const raidzItems = [TopologyItemType.Raidz, TopologyItemType.Raidz1, TopologyItemType.Raidz2, TopologyItemType.Raidz3];

@Component({
  selector: 'ix-zfs-info-card',
  templateUrl: './zfs-info-card.component.html',
  styleUrls: ['./zfs-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TranslateModule,
    UpperCasePipe,
  ],
})
export class ZfsInfoCardComponent {
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private dialogService = inject(DialogService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private vDevsStore = inject(VDevsStore);
  private snackbar = inject(SnackbarService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  readonly topologyItem = input.required<VDevItem>();
  readonly topologyParentItem = input<VDevItem>();
  readonly disk = input<Disk>();
  readonly topologyCategory = input<VDevType>();
  readonly poolId = input.required<number>();
  readonly hasTopLevelRaidz = input<boolean>();

  readonly deviceRemoved = output();

  protected readonly Role = Role;

  readonly isMirror = computed(() => this.topologyItem().type === TopologyItemType.Mirror);
  readonly isRaidz = computed(() => raidzItems.includes(this.topologyItem().type));

  readonly isRaidzParent = computed(() => {
    const parent = this.topologyParentItem();
    return parent && raidzItems.includes(parent.type);
  });

  readonly isDraidOrMirrorParent = computed(() => {
    const parent = this.topologyParentItem();
    return parent && [
      TopologyItemType.Mirror,
      TopologyItemType.Draid,
    ].includes(parent.type);
  });

  readonly isDisk = computed(() => isTopologyDisk(this.topologyItem()));

  readonly canExtendDisk = computed(() => {
    return !this.isDraidOrMirrorParent()
      && !this.isRaidzParent()
      && this.topologyItem().type === TopologyItemType.Disk
      && [VDevType.Data, VDevType.Dedup, VDevType.Special, VDevType.Log].includes(this.topologyCategory())
      && this.topologyItem().status !== TopologyItemStatus.Unavail;
  });

  readonly canRemoveDisk = computed(() => {
    return !this.isDraidOrMirrorParent()
      && !this.isRaidzParent()
      && (
        !this.hasTopLevelRaidz()
        || [VDevType.Cache, VDevType.Log, VDevType.Spare].includes(this.topologyCategory())
      );
  });

  readonly canRemoveVdev = computed(() => {
    return !this.hasTopLevelRaidz() || [VDevType.Cache, VDevType.Log].includes(this.topologyCategory());
  });

  readonly canDetachDisk = computed(() => {
    const parentItem = this.topologyParentItem();
    if (!parentItem) {
      return false;
    }
    return [
      TopologyItemType.Mirror,
      TopologyItemType.Replacing,
      TopologyItemType.Spare,
    ].includes(parentItem.type);
  });

  readonly canOfflineDisk = computed(() => {
    return this.topologyItem().status !== TopologyItemStatus.Offline
      && this.topologyItem().status !== TopologyItemStatus.Unavail
      && ![VDevType.Spare, VDevType.Cache].includes(this.topologyCategory());
  });

  readonly canOnlineDisk = computed(() => {
    return this.topologyItem().status !== TopologyItemStatus.Online
      && this.topologyItem().status !== TopologyItemStatus.Unavail
      && ![VDevType.Spare, VDevType.Cache].includes(this.topologyCategory());
  });

  private readonly hasPoolWriteRole = toSignal(
    this.authService.hasRole([Role.PoolWrite]),
    { initialValue: false },
  );

  // Extend is the primary footer action. Disks gate on canExtendDisk(); mirrors always offer it;
  // RAIDZ uses the dedicated RAIDZ-extend flow. All gated on PoolWrite (was *ixRequiresRoles).
  protected readonly extendAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasPoolWriteRole()) {
      return undefined;
    }
    if (this.isRaidz()) {
      return { label: this.translate.instant('Extend'), testId: 'extend', handler: () => this.onRaidzExtend() };
    }
    if (this.isMirror() || (this.isDisk() && this.canExtendDisk())) {
      return { label: this.translate.instant('Extend'), testId: 'extend', handler: () => this.onExtend() };
    }
    return undefined;
  });

  // Remove is the secondary footer action for disks and mirrors (RAIDZ has no remove).
  protected readonly removeAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasPoolWriteRole()) {
      return undefined;
    }
    if ((this.isDisk() && this.canRemoveDisk()) || (this.isMirror() && this.canRemoveVdev())) {
      return { label: this.translate.instant('Remove'), testId: 'remove', handler: () => this.onRemove() };
    }
    return undefined;
  });

  // Less-common disk state actions live in the card's kebab menu. Online/Offline are mutually
  // exclusive by current status, so at most one of them appears.
  protected readonly actionsMenu = computed<TnMenuItem[] | undefined>(() => {
    if (!this.hasPoolWriteRole() || !this.isDisk()) {
      return undefined;
    }
    const items: TnMenuItem[] = [];
    if (this.canDetachDisk()) {
      items.push({
        id: 'detach', label: this.translate.instant('Detach'), testId: 'detach', action: () => this.onDetach(),
      });
    }
    if (this.canOfflineDisk()) {
      items.push({
        id: 'offline', label: this.translate.instant('Offline'), testId: 'offline', action: () => this.onOffline(),
      });
    }
    if (this.canOnlineDisk()) {
      items.push({
        id: 'online', label: this.translate.instant('Online'), testId: 'online', action: () => this.onOnline(),
      });
    }
    return items.length ? items : undefined;
  });

  onOffline(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Offline Disk'),
      message: this.translate.instant('Offline disk {name}?', { name: this.disk()?.devname || this.topologyItem().guid }),
      buttonText: this.translate.instant('Offline'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.call('pool.offline', [this.poolId(), { label: this.topologyItem().guid }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
          tap(() => this.vDevsStore.reloadList()),
          takeUntilDestroyed(this.destroyRef),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onOnline(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Online Disk'),
      message: this.translate.instant('Online disk {name}?', { name: this.disk()?.devname || this.topologyItem().guid }),
      buttonText: this.translate.instant('Online'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.call('pool.online', [this.poolId(), { label: this.topologyItem().guid }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
          tap(() => this.vDevsStore.reloadList()),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onDetach(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Detach Disk'),
      message: this.translate.instant('Detach disk {name}?', { name: this.disk()?.devname || this.topologyItem().guid }),
      buttonText: this.translate.instant('Detach'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.api.call('pool.detach', [this.poolId(), { label: this.topologyItem().guid }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
          tap(() => this.vDevsStore.reloadList()),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  onRemove(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Remove device'),
      message: this.translate.instant(
        'Remove device {name}?',
        { name: this.isDisk() ? this.disk()?.devname || this.topologyItem().guid : this.topologyItem().name },
      ),
      buttonText: this.translate.instant('Remove'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.dialogService.jobDialog(
          this.api.job('pool.remove', [this.poolId(), { label: this.topologyItem().guid }]),
          { title: this.translate.instant('Remove device') },
        )
          .afterClosed()
          .pipe(this.errorHandler.withErrorHandler());
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Device removed'));
      this.vDevsStore.reloadList();
      this.deviceRemoved.emit();
    });
  }

  onExtend(): void {
    this.tnDialog.open(ExtendDialog, {
      data: {
        poolId: this.poolId(),
        targetVdevGuid: this.topologyItem().guid,
      } as ExtendDialogParams,
    })
      .closed
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.vDevsStore.reloadList();
      });
  }

  onRaidzExtend(): void {
    this.tnDialog.open(RaidzExtendDialog, {
      data: {
        poolId: this.poolId(),
        vdev: this.topologyItem() as VDev,
      } as RaidzExtendDialogParams,
    })
      .closed
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.vDevsStore.reloadList();
      });
  }
}
