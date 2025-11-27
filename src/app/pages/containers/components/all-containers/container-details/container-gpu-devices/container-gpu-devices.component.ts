import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent, MatCardHeader } from '@angular/material/card';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, of } from 'rxjs';
import { ContainerDeviceType, ContainerGpuType, ContainerStatus } from 'app/enums/container.enum';
import {
  ContainerDevice,
} from 'app/interfaces/container.interface';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddGpuDeviceMenuComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-gpu-devices/add-gpu-device-menu/add-gpu-device-menu.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/containers/components/common/device-actions-menu/device-actions-menu.component';
import {
  DeviceTypeBadgeComponent,
} from 'app/pages/containers/components/common/device-type-badge/device-type-badge.component';
import { getDeviceDescription } from 'app/pages/containers/components/common/utils/get-device-description.utils';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { nvidiaDriversCardElements } from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-card/nvidia-drivers-card.elements';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-container-gpu-devices',
  templateUrl: './container-gpu-devices.component.html',
  styleUrls: ['./container-gpu-devices.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    TranslateModule,
    MatCardContent,
    NgxSkeletonLoaderModule,
    DeviceActionsMenuComponent,
    AddGpuDeviceMenuComponent,
    DeviceTypeBadgeComponent,
    IxIconComponent,
  ],
})
export class ContainerGpuDevicesComponent {
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  private searchDirectives = inject(UiSearchDirectivesService);
  private router = inject(Router);

  private readonly nvidiaDriversEnabled = toSignal(
    this.store$.pipe(waitForAdvancedConfig).pipe(
      catchError(() => of({ nvidia: false })),
    ),
  );

  private readonly gpuChoices = toSignal(
    this.api.call('container.device.gpu_choices').pipe(
      catchError(() => of({} as Record<string, ContainerGpuType>)),
    ),
    { initialValue: null },
  );

  protected readonly isLoadingDevices = this.devicesStore.isLoading;
  protected readonly isContainerRunning = computed(() => {
    const container = this.containersStore.selectedContainer();
    return container?.status.state === ContainerStatus.Running;
  });

  protected readonly shownDevices = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return device.dtype === ContainerDeviceType.Gpu;
    });
  });

  protected readonly hasNvidiaGpusWithoutDrivers = computed(() => {
    const gpuChoices = this.gpuChoices();
    const nvidiaEnabled = this.nvidiaDriversEnabled()?.nvidia ?? false;

    if (!gpuChoices || nvidiaEnabled) {
      return false;
    }

    return Object.values(gpuChoices).some((gpuType: ContainerGpuType) => gpuType === ContainerGpuType.Nvidia);
  });

  protected getDeviceDescription(device: ContainerDevice): string {
    return getDeviceDescription(this.translate, device);
  }

  protected onEnableNvidiaDriversClick(): void {
    this.searchDirectives.setPendingUiHighlightElement(nvidiaDriversCardElements.elements.nvidiaDrivers);
    this.router.navigate(['/system', 'advanced']);
  }
}
