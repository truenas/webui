import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { startCase } from 'lodash';
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

  onUpdatePressed(): void {
    console.info(this.app);
    this.snackbar.success('Update App Pressed!');
  }

  onDeletePressed(): void {
    this.snackbar.success('Delete App Pressed!');
  }
}
