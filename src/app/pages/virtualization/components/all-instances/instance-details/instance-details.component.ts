import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';

@Component({
  selector: 'ix-instance-details',
  templateUrl: './instance-details.component.html',
  styleUrls: ['./instance-details.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InstanceDevicesComponent,
  ],
})
export class InstanceDetailsComponent {
  instance = input.required<VirtualizationInstance>();
}
