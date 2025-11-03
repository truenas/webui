import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter } from 'rxjs/operators';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerFilesystemDevice, ContainerInstance } from 'app/interfaces/container.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
  ],
})
export class InstanceDisksComponent {
  private slideIn = inject(SlideIn);
  private devicesStore = inject(VirtualizationDevicesStore);
  private instancesStore = inject(VirtualizationInstancesStore);

  readonly instance = input.required<ContainerInstance>();

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly isContainerRunning = computed(() => {
    const instance = this.instancesStore.selectedInstance();
    return instance?.status.state === ContainerStatus.Running;
  });

  protected readonly visibleDisks = computed(() => {
    return this.devicesStore.devices().filter(
      (device): device is ContainerFilesystemDevice & { id: number } => {
        return device.dtype === ContainerDeviceType.Filesystem && 'source' in device && !!device.source;
      },
    );
  });

  protected addDisk(): void {
    this.openDiskForm();
  }

  protected editDisk(disk: ContainerFilesystemDevice): void {
    this.openDiskForm(disk);
  }

  private openDiskForm(disk?: ContainerFilesystemDevice): void {
    this.slideIn.open(InstanceDiskFormComponent, { data: { disk, instance: this.instance() } })
      .pipe(filter((result) => !!result.response), untilDestroyed(this))
      .subscribe(() => this.devicesStore.loadDevices());
  }
}
