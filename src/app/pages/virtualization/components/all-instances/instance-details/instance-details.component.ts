import {
  ChangeDetectionStrategy, Component, input,
  output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  InstanceDisksComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import { InstanceMetricsComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-metrics/instance-metrics.component';
import {
  InstanceProxiesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxies.component';
import {
  InstanceToolsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-tools/instance-tools.component';

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
    InstanceDisksComponent,
    InstanceToolsComponent,
    InstanceMetricsComponent,
    MobileBackButtonComponent,
  ],
})
export class InstanceDetailsComponent {
  instance = input.required<VirtualizationInstance>();
  closeMobileDetails = output();
}
