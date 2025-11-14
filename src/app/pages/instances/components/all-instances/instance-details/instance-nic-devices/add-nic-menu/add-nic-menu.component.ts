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
  ContainerDeviceType,
  ContainerNicDeviceType,
} from 'app/enums/container.enum';
import {
  ContainerNicDevice,
} from 'app/interfaces/container.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { InstanceNicFormDialog } from 'app/pages/instances/components/common/instance-nic-form-dialog/instance-nic-form-dialog.component';
import { ContainerDevicesStore } from 'app/pages/instances/stores/container-devices.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';
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
  private devicesStore = inject(ContainerDevicesStore);
  private instancesStore = inject(ContainerInstancesStore);
  private matDialog = inject(MatDialog);

  private readonly nicChoices = toSignal(this.getNicChoices(), { initialValue: {} });

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly availableNics = computed(() => {
    const choices = this.nicChoices();
    const existingNics = this.devicesStore.devices()
      .filter((device) => device.dtype === ContainerDeviceType.Nic) as ContainerNicDevice[];

    return Object.entries(choices)
      .filter(([key]) => !existingNics.find((device) => device.nic_attach === key))
      .map(([key, label]) => ({ key, label }));
  });

  protected readonly hasNicsToAdd = computed(() => {
    return this.availableNics().length > 0;
  });

  protected addNic(nicKey: string): void {
    this.addDevice(nicKey);
  }

  private getNicChoices(): Observable<Record<string, string>> {
    return this.api.call('container.device.nic_attach_choices', []) as Observable<Record<string, string>>;
  }

  private addDevice(nicKey: string): void {
    const instanceId = this.instancesStore.selectedInstance()?.id;
    if (!instanceId) {
      return;
    }

    this.matDialog.open(InstanceNicFormDialog, {
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
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbar.success(this.translate.instant('NIC Device was added'));
        this.devicesStore.loadDevices();
      },
    });
  }
}
