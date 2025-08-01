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
  VirtualizationDeviceType, VirtualizationNicType,
  virtualizationNicTypeLabels,
} from 'app/enums/virtualization.enum';
import {
  VirtualizationNic,
} from 'app/interfaces/virtualization.interface';
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

  private readonly bridgedChoices = toSignal(this.getNicChoices(VirtualizationNicType.Bridged), { initialValue: {} });
  private readonly macVlanChoices = toSignal(this.getNicChoices(VirtualizationNicType.Macvlan), { initialValue: {} });

  protected readonly bridgedNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Bridged)
    || VirtualizationNicType.Bridged;

  protected readonly macVlanNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Macvlan)
    || VirtualizationNicType.Macvlan;

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly availableBridgedNics = computed(() => {
    const choices = Object.values(this.bridgedChoices());
    const existingItems = this.devicesStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Nic
        && device.nic_type === VirtualizationNicType.Bridged) as VirtualizationNic[];

    return choices.filter((nic) => !existingItems.find((device) => device.parent === nic));
  });

  protected readonly availableMacVlanNics = computed(() => {
    const choices = Object.values(this.macVlanChoices());
    const existingItems = this.devicesStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Nic
        && device.nic_type === VirtualizationNicType.Macvlan) as VirtualizationNic[];

    return choices.filter((nic) => !existingItems.find((device) => device.parent === nic));
  });

  protected readonly hasNicsToAdd = computed(() => {
    return this.availableBridgedNics().length > 0 || Object.keys(this.availableMacVlanNics()).length > 0;
  });

  protected addBridgedNic(nic: string): void {
    this.addDevice({
      dev_type: VirtualizationDeviceType.Nic,
      nic_type: VirtualizationNicType.Bridged,
      parent: nic,
    } as VirtualizationNic);
  }

  protected addMacVlanNic(nic: string): void {
    this.addDevice({
      dev_type: VirtualizationDeviceType.Nic,
      nic_type: VirtualizationNicType.Macvlan,
      parent: nic,
    } as VirtualizationNic);
  }

  private getNicChoices(nicType: VirtualizationNicType): Observable<Record<string, string>> {
    return this.api.call('virt.device.nic_choices', [nicType]);
  }

  private addDevice(payload: VirtualizationNic): void {
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
        return this.api.call('virt.instance.device_add', [instanceId, payload]).pipe(
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
