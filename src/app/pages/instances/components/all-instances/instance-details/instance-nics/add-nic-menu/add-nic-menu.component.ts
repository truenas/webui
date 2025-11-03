import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter, Observable, switchMap } from 'rxjs';
import {
  ContainerDeviceType, ContainerNicType,
  containerNicTypeLabels,
} from 'app/enums/container.enum';
import {
  ContainerNicDevice,
} from 'app/interfaces/container.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceNicMacDialog } from 'app/pages/instances/components/common/instance-nics-mac-addr-dialog/instance-nic-mac-dialog.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-add-nic-menu',
  templateUrl: './add-nic-menu.component.html',
  styleUrls: ['./add-nic-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatMenu,
    MatMenuItem,
    TestDirective,
    TranslateModule,
    MatMenuTrigger,
    NgxSkeletonLoaderModule,
  ],
})
export class AddNicMenuComponent {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private devicesStore = inject(VirtualizationDevicesStore);
  private instancesStore = inject(VirtualizationInstancesStore);
  private matDialog = inject(MatDialog);

  private readonly bridgedChoices = toSignal(this.getNicChoices(), { initialValue: {} });
  private readonly macVlanChoices = toSignal(this.getNicChoices(), { initialValue: {} });

  protected readonly bridgedNicTypeLabel = containerNicTypeLabels.get(ContainerNicType.Bridged)
    || ContainerNicType.Bridged;

  protected readonly macVlanNicTypeLabel = containerNicTypeLabels.get(ContainerNicType.Macvlan)
    || ContainerNicType.Macvlan;

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly availableBridgedNics = computed(() => {
    const choices = Object.values(this.bridgedChoices());
    const existingItems = this.devicesStore.devices()
      .filter((device) => device.dev_type === ContainerDeviceType.Nic
        && device.nic_type === ContainerNicType.Bridged) as ContainerNicDevice[];

    return choices.filter((nic) => !existingItems.find((device) => device.parent === nic));
  });

  protected readonly availableMacVlanNics = computed(() => {
    const choices = Object.values(this.macVlanChoices());
    const existingItems = this.devicesStore.devices()
      .filter((device) => device.dev_type === ContainerDeviceType.Nic
        && device.nic_type === ContainerNicType.Macvlan) as ContainerNicDevice[];

    return choices.filter((nic) => !existingItems.find((device) => device.parent === nic));
  });

  protected readonly hasNicsToAdd = computed(() => {
    return this.availableBridgedNics().length > 0 || Object.keys(this.availableMacVlanNics()).length > 0;
  });

  protected addBridgedNic(nic: string): void {
    this.addDevice({
      dev_type: ContainerDeviceType.Nic,
      nic_type: ContainerNicType.Bridged,
      parent: nic,
    } as ContainerNicDevice);
  }

  protected addMacVlanNic(nic: string): void {
    this.addDevice({
      dev_type: ContainerDeviceType.Nic,
      nic_type: ContainerNicType.Macvlan,
      parent: nic,
    } as ContainerNicDevice);
  }

  private getNicChoices(): Observable<Record<string, string>> {
    return this.api.call('container.device.nic_attach_choices', []);
  }

  private addDevice(payload: ContainerNicDevice): void {
    const instanceId = this.instancesStore.selectedInstance()?.id;
    if (!instanceId) {
      return;
    }

    this.matDialog.open(InstanceNicMacDialog, {
      data: payload.parent,
      minWidth: '500px',
    }).afterClosed().pipe(
      filter(Boolean),
      switchMap((macConfig: { mac: string; useDefault: boolean }) => {
        if (macConfig.mac) {
          payload.mac = macConfig.mac;
        }
        return this.api.call('container.device.create', [{
          container: instanceId,
          attributes: payload,
        }]).pipe(
          this.loader.withLoader(),
          this.errorHandler.withErrorHandler(),
        );
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('NIC was added'));
        this.devicesStore.loadDevices();
      },
    });
  }
}
