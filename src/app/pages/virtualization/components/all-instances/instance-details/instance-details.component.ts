import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import {
  InstanceProxiesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxies.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

@Component({
  selector: 'ix-instance-details',
  templateUrl: './instance-details.component.html',
  styleUrls: ['./instance-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    InstanceDevicesComponent,
    InstanceGeneralInfoComponent,
    InstanceProxiesComponent,
  ],
})
export class InstanceDetailsComponent {
  instance = input.required<VirtualizationInstance>();

  protected readonly devices = this.instancesStore.selectedInstanceDevices;
  protected readonly isLoadingDevices = this.instancesStore.isLoadingDevices;

  constructor(
    private instancesStore: VirtualizationInstancesStore,
  ) {}

  onCloseMobileDetails(): void {
    this.instancesStore.selectInstance(null);
  }
}
