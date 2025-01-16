import { NgTemplateOutlet, UpperCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent, MatCardActions,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VdevType, TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import {
  isTopologyDisk, TopologyItem, VDev,
} from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ExtendDialogComponent, ExtendDialogParams,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/extend-dialog/extend-dialog.component';
import {
  RaidzExtendDialogComponent, RaidzExtendDialogParams,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/raidz-extend-dialog/raidz-extend-dialog.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

const raidzItems = [TopologyItemType.Raidz, TopologyItemType.Raidz1, TopologyItemType.Raidz2, TopologyItemType.Raidz3];

@UntilDestroy()
@Component({
  selector: 'ix-zfs-info-card',
  templateUrl: './zfs-info-card.component.html',
  styleUrls: ['./zfs-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    MatCardActions,
    NgTemplateOutlet,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    UpperCasePipe,
  ],
})
export class ZfsInfoCardComponent {
  readonly topologyItem = input.required<TopologyItem>();
  readonly topologyParentItem = input<TopologyItem>();
  readonly disk = input<Disk>();
  readonly topologyCategory = input<VdevType>();
  readonly poolId = input.required<number>();
  readonly hasTopLevelRaidz = input<boolean>();

  readonly deviceRemoved = output();

  protected readonly Role = Role;

  readonly isMirror = computed(() => this.topologyItem().type === TopologyItemType.Mirror);
  readonly isRaidz = computed(() => raidzItems.includes(this.topologyItem().type));

  readonly isRaidzParent = computed(() => raidzItems.includes(this.topologyParentItem().type));

  readonly isDraidOrMirrorParent = computed(() => {
    return [
      TopologyItemType.Mirror,
      TopologyItemType.Draid,
    ].includes(this.topologyParentItem().type);
  });

  readonly isDisk = computed(() => isTopologyDisk(this.topologyItem()));

  readonly canExtendDisk = computed(() => {
    return !this.isDraidOrMirrorParent()
      && !this.isRaidzParent()
      && this.topologyItem().type === TopologyItemType.Disk
      && [VdevType.Data, VdevType.Dedup, VdevType.Special, VdevType.Log].includes(this.topologyCategory())
      && this.topologyItem().status !== TopologyItemStatus.Unavail;
  });

  readonly canRemoveDisk = computed(() => {
    return !this.isDraidOrMirrorParent()
      && !this.isRaidzParent()
      && (
        !this.hasTopLevelRaidz()
        || [VdevType.Cache, VdevType.Log, VdevType.Spare].includes(this.topologyCategory())
      );
  });

  readonly canRemoveVdev = computed(() => {
    return !this.hasTopLevelRaidz() || [VdevType.Cache, VdevType.Log].includes(this.topologyCategory());
  });

  readonly canDetachDisk = computed(() => {
    return [
      TopologyItemType.Mirror,
      TopologyItemType.Replacing,
      TopologyItemType.Spare,
    ].includes(this.topologyParentItem().type);
  });

  readonly canOfflineDisk = computed(() => {
    return this.topologyItem().status !== TopologyItemStatus.Offline
      && this.topologyItem().status !== TopologyItemStatus.Unavail
      && ![VdevType.Spare, VdevType.Cache].includes(this.topologyCategory());
  });

  readonly canOnlineDisk = computed(() => {
    return this.topologyItem().status !== TopologyItemStatus.Online
      && this.topologyItem().status !== TopologyItemStatus.Unavail
      && ![VdevType.Spare, VdevType.Cache].includes(this.topologyCategory());
  });

  constructor(
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private api: ApiService,
    private dialogService: DialogService,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private devicesStore: DevicesStore,
    private snackbar: SnackbarService,
  ) {}

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
          this.errorHandler.catchError(),
          tap(() => this.devicesStore.reloadList()),
          untilDestroyed(this),
        );
      }),
      untilDestroyed(this),
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
          this.errorHandler.catchError(),
          tap(() => this.devicesStore.reloadList()),
        );
      }),
      untilDestroyed(this),
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
          this.errorHandler.catchError(),
          tap(() => this.devicesStore.reloadList()),
        );
      }),
      untilDestroyed(this),
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
          .pipe(this.errorHandler.catchError());
      }),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(this.translate.instant('Device removed'));
      this.devicesStore.reloadList();
      this.deviceRemoved.emit();
    });
  }

  onExtend(): void {
    this.matDialog.open(ExtendDialogComponent, {
      data: {
        poolId: this.poolId(),
        targetVdevGuid: this.topologyItem().guid,
      } as ExtendDialogParams,
    })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.devicesStore.reloadList();
      });
  }

  onRaidzExtend(): void {
    this.matDialog.open(RaidzExtendDialogComponent, {
      data: {
        poolId: this.poolId(),
        vdev: this.topologyItem() as VDev,
      } as RaidzExtendDialogParams,
    })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.devicesStore.reloadList();
      });
  }
}
