import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationProxy } from 'app/interfaces/virtualization.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  InstanceProxyFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxy-form/instance-proxy-form.component';
import {
  DeviceActionsMenuComponent,
} from 'app/pages/virtualization/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-proxies',
  templateUrl: './instance-proxies.component.html',
  styleUrls: ['./instance-proxies.component.scss'],
  standalone: true,
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
  protected readonly isLoadingDevices = this.instanceStore.isLoadingDevices;

  constructor(
    private slideIn: ChainedSlideInService,
    private instanceStore: VirtualizationInstancesStore,
  ) {}

  protected readonly proxies = computed(() => {
    return this.instanceStore.selectedInstanceDevices().filter((device) => {
      return device.dev_type === VirtualizationDeviceType.Proxy;
    });
  });

  protected addProxy(): void {
    this.openProxyForm();
  }

  protected editProxy(proxy: VirtualizationProxy): void {
    this.openProxyForm(proxy);
  }

  private openProxyForm(proxy?: VirtualizationProxy): void {
    this.slideIn.open(
      InstanceProxyFormComponent,
      false,
      { proxy, instanceId: this.instanceStore.selectedInstance().id },
    )
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (!result.response) {
          return;
        }
        this.instanceStore.loadDevices();
      });
  }
}
