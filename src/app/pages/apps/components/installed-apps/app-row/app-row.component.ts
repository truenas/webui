import { Component, Input } from '@angular/core';
import { appImagePlaceholder } from 'app/constants/catalog.constants';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-row',
  templateUrl: './app-row.component.html',
  styleUrls: ['./app-row.component.scss'],
})
export class AppRowComponent {
  @Input() application: ChartRelease;

  readonly imagePlaceholder = appImagePlaceholder;
  readonly chartReleaseStatus = ChartReleaseStatus;

  get isAppStopped(): boolean {
    return this.application.status === ChartReleaseStatus.Stopped;
  }

  toggleAppChecked(checked: boolean): void {
    this.application.selected = checked;
  }
}
