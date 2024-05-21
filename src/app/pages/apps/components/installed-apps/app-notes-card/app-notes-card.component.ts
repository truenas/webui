import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-notes-card',
  templateUrl: './app-notes-card.component.html',
  styleUrls: ['./app-notes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNotesCardComponent {
  readonly app = input.required<ChartRelease>();
}
