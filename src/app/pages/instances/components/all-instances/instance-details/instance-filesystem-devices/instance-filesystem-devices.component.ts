import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter } from 'rxjs/operators';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { ContainerDevice, ContainerFilesystemDevice, ContainerInstance } from 'app/interfaces/container.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  InstanceFilesystemDeviceFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-filesystem-devices/instance-filesystem-device-form/instance-filesystem-device-form.component';
import { DeviceActionsMenuComponent } from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import {
  DeviceTypeBadgeComponent,
} from 'app/pages/instances/components/common/device-type-badge/device-type-badge.component';
import { getDeviceDescription } from 'app/pages/instances/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-instance-filesystem-devices',
  templateUrl: './instance-filesystem-devices.component.html',
  styleUrls: ['./instance-filesystem-devices.component.scss'],
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
    DeviceTypeBadgeComponent,
  ],
})
export class InstanceFilesystemDevicesComponent {
  private slideIn = inject(SlideIn);
  private devicesStore = inject(ContainerDevicesStore);
  private instancesStore = inject(ContainerInstancesStore);
  private translate = inject(TranslateService);

  readonly instance = input.required<ContainerInstance>();

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly isContainerRunning = computed(() => {
    const instance = this.instancesStore.selectedInstance();
    return instance?.status.state === ContainerStatus.Running;
  });

  protected readonly visibleDisks = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return device.dtype === ContainerDeviceType.Filesystem;
    });
  });

  protected addDisk(): void {
    this.openDiskForm();
  }

  protected editDisk(disk: ContainerFilesystemDevice): void {
    this.openDiskForm(disk);
  }

  protected getDeviceDescription(device: ContainerDevice): string {
    return getDeviceDescription(this.translate, device);
  }

  private openDiskForm(disk?: ContainerFilesystemDevice): void {
    this.slideIn.open(InstanceFilesystemDeviceFormComponent, { data: { disk, instance: this.instance() } })
      .pipe(filter((result) => !!result.response), untilDestroyed(this))
      .subscribe(() => this.devicesStore.loadDevices());
  }
}
