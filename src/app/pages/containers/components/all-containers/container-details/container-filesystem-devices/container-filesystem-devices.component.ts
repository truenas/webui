import { ChangeDetectionStrategy, Component, computed, input, inject, DestroyRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnCardAction, TnCardComponent } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { ContainerDeviceType, ContainerStatus } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container, ContainerDevice, ContainerFilesystemDevice } from 'app/interfaces/container.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  ContainerFilesystemDeviceFormComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-device-form/container-filesystem-device-form.component';
import { DeviceActionsMenuComponent } from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/containers/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-container-filesystem-devices',
  templateUrl: './container-filesystem-devices.component.html',
  styleUrls: ['./container-filesystem-devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    NgxSkeletonLoaderModule,
    TranslateModule,
    DeviceActionsMenuComponent,
  ],
})
export class ContainerFilesystemDevicesComponent {
  protected readonly requiredRoles = [Role.ContainerDeviceWrite];

  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  readonly container = input.required<Container>();

  private hasDeviceWriteRole = toSignal(
    this.authService.hasRole(this.requiredRoles),
    { initialValue: false },
  );

  protected readonly addAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasDeviceWriteRole()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Add'),
      testId: 'add-disk',
      handler: () => this.addDisk(),
    };
  });

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly isContainerRunning = computed(() => {
    const container = this.containersStore.selectedContainer();
    return container?.status.state === ContainerStatus.Running;
  });

  protected readonly visibleDisks = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return device.dtype === ContainerDeviceType.Filesystem;
    });
  });

  protected addDisk(): void {
    this.openForm(undefined);
  }

  protected editDisk(disk: ContainerFilesystemDevice): void {
    this.openForm(disk);
  }

  protected getDeviceDescription(device: ContainerDevice): string {
    return getDeviceDescription(this.translate, device);
  }

  private openForm(disk: ContainerFilesystemDevice | undefined): void {
    this.formPanel.open(ContainerFilesystemDeviceFormComponent, {
      title: disk
        ? this.translate.instant('Edit Disk')
        : this.translate.instant('Add Disk'),
      inputs: {
        disk,
        container: this.container(),
      },
    }).onSuccess(() => this.devicesStore.reload(), this.destroyRef);
  }
}
