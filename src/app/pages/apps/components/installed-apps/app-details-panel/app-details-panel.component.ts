import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-details-panel',
  templateUrl: './app-details-panel.component.html',
  styleUrls: ['./app-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsPanelComponent {
  @Input() app: ChartRelease;
}
