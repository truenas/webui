import { ChangeDetectionStrategy, Component, computed, input, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { containersHelptext } from 'app/helptext/containers/containers';
import { Container, ContainerDevice, ContainerFilesystemDevice } from 'app/interfaces/container.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  ContainerFilesystemDeviceFormComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-device-form/container-filesystem-device-form.component';
import { DeviceActionsMenuComponent } from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import { getDeviceDescription } from 'app/pages/containers/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { isContainerActive } from 'app/pages/containers/utils/container-status.utils';

@Component({
  selector: 'ix-container-filesystem-devices',
  templateUrl: './container-filesystem-devices.component.html',
  styleUrls: ['./container-filesystem-devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatTooltip,
    NgxSkeletonLoaderModule,
    TestDirective,
    TranslateModule,
    DeviceActionsMenuComponent,
    RequiresRolesDirective,
  ],
})
export class ContainerFilesystemDevicesComponent {
  protected readonly requiredRoles = [Role.ContainerDeviceWrite];

  private destroyRef = inject(DestroyRef);
  private slideIn = inject(SlideIn);
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
  private translate = inject(TranslateService);

  readonly container = input.required<Container>();

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly helptext = containersHelptext;

  // Middleware refuses device operations on any container that is not stopped, which since
  // 26.0 includes SUSPENDED - not just RUNNING.
  protected readonly isContainerActive = computed(() => {
    return isContainerActive(this.containersStore.selectedContainer());
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
    this.slideIn.open(ContainerFilesystemDeviceFormComponent, { data: { disk, container: this.container() } })
      .pipe(filter((result) => !!result.response), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.devicesStore.reload());
  }
}
