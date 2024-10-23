import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/instance-view/instance-devices/instance-devices.component';

@Component({
  selector: 'ix-instance-view',
  styleUrls: ['./instance-view.component.scss'],
  templateUrl: './instance-view.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InstanceDevicesComponent,
    MatButton,
    TranslateModule,
  ],
})
export class InstanceViewComponent {

}
