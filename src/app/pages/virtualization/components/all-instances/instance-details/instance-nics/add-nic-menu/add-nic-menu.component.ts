import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable } from 'rxjs';
import {
  VirtualizationDeviceType, VirtualizationNicType,
  virtualizationNicTypeLabels,
} from 'app/enums/virtualization.enum';
import {
  VirtualizationDevice,
  VirtualizationNic,
} from 'app/interfaces/virtualization.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-add-nic-menu',
  templateUrl: './add-nic-menu.component.html',
  styleUrls: ['./add-nic-menu.component.scss'],
  standalone: true,
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
  private readonly bridgedChoices = toSignal(this.getNicChoices(VirtualizationNicType.Bridged), { initialValue: {} });
  private readonly macVlanChoices = toSignal(this.getNicChoices(VirtualizationNicType.Macvlan), { initialValue: {} });

  protected readonly bridgedNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Bridged);
  protected readonly macVlanNicTypeLabel = virtualizationNicTypeLabels.get(VirtualizationNicType.Macvlan);

  protected readonly isLoadingDevices = this.deviceStore.isLoading;

  protected readonly availableBridgedNics = computed(() => {
    const choices = Object.values(this.bridgedChoices());
    const existingItems = this.deviceStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Nic
        && device.nic_type === VirtualizationNicType.Bridged) as VirtualizationNic[];

    return choices.filter((nic) => !existingItems.find((device) => device.parent === nic));
  });

  protected readonly availableMacVlanNics = computed(() => {
    const choices = Object.values(this.macVlanChoices());
    const existingItems = this.deviceStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Nic
        && device.nic_type === VirtualizationNicType.Macvlan) as VirtualizationNic[];

    return choices.filter((nic) => !existingItems.find((device) => device.parent === nic));
  });

  protected readonly hasNicsToAdd = computed(() => {
    return this.availableBridgedNics().length > 0 || Object.keys(this.availableMacVlanNics()).length > 0;
  });

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private deviceStore: VirtualizationDevicesStore,
  ) {}

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

  private addDevice(payload: VirtualizationDevice): void {
    const instanceId = this.deviceStore.selectedInstance().id;
    this.api.call('virt.instance.device_add', [instanceId, payload])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('NIC was added'));
        this.deviceStore.loadDevices();
      });
  }
}
