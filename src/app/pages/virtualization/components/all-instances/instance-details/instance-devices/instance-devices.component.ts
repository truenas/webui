import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';

@Component({
  selector: 'ix-instance-devices',
  templateUrl: './instance-devices.component.html',
  styleUrls: ['./instance-devices.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCardModule,
    TranslateModule,
  ],
})
export class InstanceDevicesComponent {
  instance = input.required<VirtualizationInstance>();
}
