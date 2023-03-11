import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { startCase } from 'lodash';
import { ChartReleaseEvent } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { RedirectService } from 'app/services';

@Component({
  selector: 'ix-app-info-card',
  templateUrl: './app-info-card.component.html',
  styleUrls: ['./app-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppInfoCardComponent {
  @Input() app: ChartRelease;
  @Input() events: ChartReleaseEvent[];

  constructor(
    private snackbar: SnackbarService,
    private redirect: RedirectService,
  ) {}

  portalName(name = 'web_portal'): string {
    return startCase(name);
  }

  portalLink(chart: ChartRelease, name = 'web_portal'): void {
    this.redirect.openWindow(chart.portals[name][0]);
  }

  updateButtonPressed(): void {
    this.snackbar.success('Update App Pressed!');
  }

  deleteButtonPressed(): void {
    this.snackbar.success('Delete App Pressed!');
  }
}
