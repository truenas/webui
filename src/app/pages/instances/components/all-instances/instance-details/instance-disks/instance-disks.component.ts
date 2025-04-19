import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import {
  diskIoBusLabels, VirtualizationDeviceType, VirtualizationStatus, VirtualizationType,
} from 'app/enums/virtualization.enum';
import { VirtualizationDisk, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ChangeBootFromDiskComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-disks/change-boot-from-disk/change-boot-from-disk.component';
import {
  ChangeRootDiskSetupComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/change-root-disk-setup/change-root-disk-setup.component';
import {
  InstanceDiskFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disk-form/instance-disk-form.component';
import { DeviceActionsMenuComponent } from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-instance-disks',
  templateUrl: './instance-disks.component.html',
  styleUrls: ['./instance-disks.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    NgxSkeletonLoaderModule,
    TestDirective,
    TranslateModule,
    DeviceActionsMenuComponent,
    FileSizePipe,
    MatTooltip,
    MapValuePipe,
  ],
})
export class InstanceDisksComponent {
  readonly instance = input.required<VirtualizationInstance>();

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly diskIoBusLabels = diskIoBusLabels;

  protected readonly disksDisabledMessage = this.translate.instant(
    'VM disks cannot be managed while the instance is running.',
  );

  protected readonly isVmRunning = computed(() => {
    return this.instance().status === VirtualizationStatus.Running && this.instance().type === VirtualizationType.Vm;
  });

  protected readonly isVm = computed(() => this.instance().type === VirtualizationType.Vm);
  protected readonly isContainer = computed(() => this.instance().type === VirtualizationType.Container);

  constructor(
    private slideIn: SlideIn,
    private matDialog: MatDialog,
    private translate: TranslateService,
    private devicesStore: VirtualizationDevicesStore,
    private instanceStore: VirtualizationInstancesStore,
  ) {}

  protected readonly visibleDisks = computed(() => this.devicesStore.devices().filter(
    (device): device is VirtualizationDisk => device.dev_type === VirtualizationDeviceType.Disk && !!device.source,
  ));

  protected readonly primaryBootDisk = computed<VirtualizationDisk | null>(() => {
    const disksWithPriority = this.visibleDisks().filter((disk) => typeof disk.boot_priority === 'number');

    if (!disksWithPriority.length) return null;

    return disksWithPriority.reduce((highest, disk) => (disk.boot_priority > highest.boot_priority ? disk : highest));
  });

  protected addDisk(): void {
    this.openDiskForm();
  }

  protected editDisk(disk: VirtualizationDisk): void {
    this.openDiskForm(disk);
  }

  protected showRootDiskIncreaseDialog(): void {
    this.matDialog.open(ChangeRootDiskSetupComponent, { data: this.instance() })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((newRootDiskSize: number) => this.instanceStore.instanceUpdated({
        ...this.instance(),
        root_disk_size: newRootDiskSize * GiB,
      }));
  }

  protected showChangeBootFromDiskDialog(): void {
    this.matDialog.open(ChangeBootFromDiskComponent, {
      data: {
        instance: this.instance(),
        visibleDisks: this.visibleDisks(),
        primaryBootDisk: this.primaryBootDisk(),
      },
    })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.devicesStore.loadDevices());
  }

  private openDiskForm(disk?: VirtualizationDisk): void {
    this.slideIn.open(InstanceDiskFormComponent, { data: { disk, instance: this.instance() } })
      .pipe(filter((result) => !!result.response), untilDestroyed(this))
      .subscribe(() => this.devicesStore.loadDevices());
  }
}
