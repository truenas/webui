import { ChangeDetectionStrategy, Component, computed, inject, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { catchError, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerDeviceType, ContainerGpuType } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { ContainerGpuDevice } from 'app/interfaces/container.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

interface GpuMenuItem {
  pciAddress: string;
  gpuType: string;
  description: string;
}

@Component({
  selector: 'ix-add-gpu-device-menu',
  templateUrl: './add-gpu-device-menu.component.html',
  styleUrls: ['./add-gpu-device-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatMenu,
    MatMenuItem,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    NgxSkeletonLoaderModule,
    RequiresRolesDirective,
  ],
})
export class AddGpuDeviceMenuComponent {
  protected readonly requiredRoles = [Role.ContainerWrite];

  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
  private store$ = inject<Store<AppState>>(Store);

  protected readonly nvidiaDriversEnabled = toSignal(
    this.store$.pipe(waitForAdvancedConfig).pipe(
      catchError(() => of({ nvidia: false })),
    ),
  );

  private readonly gpuChoices = toSignal(
    this.api.call('container.device.gpu_choices').pipe(
      catchError((error: unknown) => {
        this.errorHandler.showErrorModal(error);
        return of({} as Record<string, ContainerGpuType>);
      }),
    ),
    { initialValue: null },
  );

  protected readonly isLoading = computed(() => {
    const devicesLoading = this.devicesStore.isLoading();
    const gpuChoices = this.gpuChoices();
    return devicesLoading || gpuChoices === null;
  });

  protected readonly availableGpuDevices = computed(() => {
    const gpuChoices = this.gpuChoices();
    const nvidiaEnabled = this.nvidiaDriversEnabled()?.nvidia ?? false;

    if (!gpuChoices) {
      return [];
    }

    const existingGpuDevices = this.devicesStore.devices()
      .filter((device) => device.dtype === ContainerDeviceType.Gpu);

    return Object.entries(gpuChoices)
      .filter(([pciAddress, gpuType]: [string, ContainerGpuType]) => {
        const isAlreadyAdded = existingGpuDevices
          .some((device) => device.pci_address === pciAddress);

        // Filter out NVIDIA GPUs if drivers aren't enabled
        if (gpuType === ContainerGpuType.Nvidia && !nvidiaEnabled) {
          return false;
        }

        return !isAlreadyAdded;
      })
      .map(([pciAddress, gpuType]): GpuMenuItem => ({
        pciAddress,
        gpuType,
        description: `${gpuType} (${pciAddress})`,
      }));
  });

  protected readonly hasDevicesToAdd = computed(() => {
    return this.availableGpuDevices().length > 0;
  });

  protected addGpu(gpu: GpuMenuItem): void {
    this.addDevice({
      dtype: ContainerDeviceType.Gpu,
      gpu_type: gpu.gpuType as 'NVIDIA' | 'AMD',
      pci_address: gpu.pciAddress,
    } as ContainerGpuDevice);
  }

  private addDevice(payload: Partial<ContainerGpuDevice>): void {
    const instanceId = this.containersStore.selectedContainer()?.id;
    if (!instanceId) {
      return;
    }

    this.api.call('container.device.create', [{
      container: instanceId,
      attributes: payload as ContainerGpuDevice,
    }])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('GPU Device was added'));
        this.devicesStore.reload();
      });
  }
}
