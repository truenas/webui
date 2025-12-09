import { ChangeDetectionStrategy, Component, computed, inject, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter, Observable, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import {
  ContainerDeviceType,
  ContainerNicDeviceType,
} from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import {
  ContainerNicDevice,
} from 'app/interfaces/container.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerNicFormDialog } from 'app/pages/containers/components/common/container-nic-form-dialog/container-nic-form-dialog.component';
import { ContainerDevicesStore } from 'app/pages/containers/stores/container-devices.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-add-nic-menu',
  templateUrl: './add-nic-menu.component.html',
  styleUrls: ['./add-nic-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatDivider,
    MatMenu,
    MatMenuItem,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    NgxSkeletonLoaderModule,
    RequiresRolesDirective,
  ],
})
export class AddNicMenuComponent {
  protected readonly requiredRoles = [Role.ContainerWrite];

  private destroyRef = inject(DestroyRef);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private devicesStore = inject(ContainerDevicesStore);
  private containersStore = inject(ContainersStore);
  private matDialog = inject(MatDialog);

  private readonly nicChoices = toSignal(
    this.getNicChoices(),
    { initialValue: {} as Record<string, string | string[]> },
  );

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly availableNicGroups = computed(() => {
    const choices = this.nicChoices();
    const existingNics = this.devicesStore.devices()
      .filter((device) => device.dtype === ContainerDeviceType.Nic) as ContainerNicDevice[];

    // Check if we're dealing with the new grouped format (arrays) or old flat format (strings)
    const isNewFormat = Object.values(choices).some((value) => Array.isArray(value));

    let groups;
    if (isNewFormat) {
      // New format: { "BRIDGE": ["ens1"], "MACVLAN": ["truenasbr0"] }
      groups = Object.entries(choices)
        .map(([groupType, nics]) => ({
          type: groupType,
          label: this.getNicGroupLabel(groupType),
          nics: (nics as string[])
            .filter((nic) => !existingNics.find((device) => device.nic_attach === nic))
            .map((nic) => ({ key: nic, label: nic })),
        }))
        .filter((group) => group.nics.length > 0);
    } else {
      // Old format: { "ens1": "ens1", "truenasbr0": "truenasbr0" }
      // Display all NICs under generic group headers
      const allNics = Object.keys(choices)
        .filter((nic) => !existingNics.find((device) => device.nic_attach === nic));

      // Try to categorize NICs by common naming patterns (best-effort guesses for backward compatibility)
      // Note: This heuristic may not be 100% accurate but provides reasonable categorization:
      // - NICs with 'br' or 'bridge' in the name are assumed to be bridge devices (e.g., truenasbr0, vmbr0)
      // - All other NICs are assumed to be MACVLAN devices (e.g., ens1, eth0)
      // This is a temporary compatibility measure - the new grouped format from the API is preferred
      const bridgeNics = allNics.filter((nic) => nic.toLowerCase().includes('br') || nic.toLowerCase().includes('bridge'));
      const macvlanNics = allNics.filter((nic) => !nic.toLowerCase().includes('br') && !nic.toLowerCase().includes('bridge'));

      groups = [];
      if (bridgeNics.length > 0) {
        groups.push({
          type: 'BRIDGE',
          label: this.getNicGroupLabel('BRIDGE'),
          nics: bridgeNics.map((nic) => ({ key: nic, label: nic })),
        });
      }
      if (macvlanNics.length > 0) {
        groups.push({
          type: 'MACVLAN',
          label: this.getNicGroupLabel('MACVLAN'),
          nics: macvlanNics.map((nic) => ({ key: nic, label: nic })),
        });
      }
    }

    return groups;
  });

  private getNicGroupLabel(groupType: string): string {
    const labels: Record<string, string> = {
      BRIDGE: this.translate.instant('Bridged Devices'),
      MACVLAN: this.translate.instant('MACVLAN Devices'),
    };
    return labels[groupType] || groupType;
  }

  protected readonly hasNicsToAdd = computed(() => {
    return this.availableNicGroups().some((group) => group.nics.length > 0);
  });

  protected addNic(nicKey: string): void {
    this.addDevice(nicKey);
  }

  private getNicChoices(): Observable<Record<string, string | string[]>> {
    return this.api.call('container.device.nic_attach_choices', []);
  }

  private addDevice(nicKey: string): void {
    const instanceId = this.containersStore.selectedContainer()?.id;
    if (!instanceId) {
      return;
    }

    this.matDialog.open(ContainerNicFormDialog, {
      data: { nic: nicKey },
      minWidth: '500px',
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap((config: {
        mac?: string;
        useDefault: boolean;
        type: ContainerNicDeviceType;
        trust_guest_rx_filters?: boolean;
      }) => {
        const payload: Partial<ContainerNicDevice> = {
          dtype: ContainerDeviceType.Nic,
          type: config.type,
          nic_attach: nicKey,
        };

        if (config.mac) {
          payload.mac = config.mac;
        }

        // trust_guest_rx_filters can only be set for VIRTIO NICs
        if (config.type === ContainerNicDeviceType.Virtio && config.trust_guest_rx_filters !== undefined) {
          payload.trust_guest_rx_filters = config.trust_guest_rx_filters;
        }

        return this.api.call('container.device.create', [{
          container: instanceId,
          attributes: payload as ContainerNicDevice,
        }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('NIC Device was added'));
        this.devicesStore.reload();
      },
    });
  }
}
