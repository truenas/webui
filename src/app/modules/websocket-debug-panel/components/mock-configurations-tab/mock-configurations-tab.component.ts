import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MockConfigListComponent } from 'app/modules/websocket-debug-panel/components/mock-config/mock-config-list/mock-config-list.component';

@Component({
  selector: 'ix-mock-configurations-tab',
  standalone: true,
  imports: [MockConfigListComponent],
  templateUrl: './mock-configurations-tab.component.html',
  styleUrls: ['./mock-configurations-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockConfigurationsTabComponent {}
