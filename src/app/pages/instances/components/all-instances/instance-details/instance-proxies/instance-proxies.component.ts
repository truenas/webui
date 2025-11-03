import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter } from 'rxjs';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { ContainerProxyDevice } from 'app/interfaces/container.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  InstanceProxyFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-proxies/instance-proxy-form/instance-proxy-form.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/instances/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-instance-proxies',
  templateUrl: './instance-proxies.component.html',
  styleUrls: ['./instance-proxies.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatButton,
    TestDirective,
    NgxSkeletonLoaderModule,
    DeviceActionsMenuComponent,
  ],
})
export class InstanceProxiesComponent {
  private slideIn = inject(SlideIn);
  private devicesStore = inject(VirtualizationDevicesStore);
  private instancesStore = inject(VirtualizationInstancesStore);

  protected readonly isLoadingDevices = this.devicesStore.isLoading;

  protected readonly proxies = computed(() => {
    return this.devicesStore.devices().filter((device) => {
      return device.dev_type === VirtualizationDeviceType.Proxy;
    });
  });

  protected addProxy(): void {
    this.openProxyForm();
  }

  protected editProxy(proxy: ContainerProxyDevice): void {
    this.openProxyForm(proxy);
  }

  private openProxyForm(proxy?: ContainerProxyDevice): void {
    const instanceId = this.instancesStore.selectedInstance()?.id;
    if (!instanceId) {
      return;
    }

    this.slideIn
      .open(InstanceProxyFormComponent, { data: { proxy, instanceId } })
      .pipe(filter((result) => !!result.response), untilDestroyed(this))
      .subscribe(() => this.devicesStore.loadDevices());
  }
}
