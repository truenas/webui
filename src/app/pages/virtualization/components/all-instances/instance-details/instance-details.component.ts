import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';

@Component({
  selector: 'ix-instance-details',
  templateUrl: './instance-details.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InstanceDevicesComponent,
  ],
})
export class InstanceDetailsComponent {

}
