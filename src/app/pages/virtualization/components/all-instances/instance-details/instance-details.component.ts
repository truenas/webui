import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
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
    MobileBackButtonComponent,
  ],
})
export class InstanceDetailsComponent {
  instance = input.required<VirtualizationInstance>();

  onCloseMobileDetails(): void {
    inject(VirtualizationInstancesStore).selectInstance(null);
  }
}
