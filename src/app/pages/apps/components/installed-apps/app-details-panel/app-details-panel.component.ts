import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { Router } from '@angular/router';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-details-panel',
  templateUrl: './app-details-panel.component.html',
  styleUrls: ['./app-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsPanelComponent {
  @Input() app: ChartRelease;

  constructor(
    private router: Router,
  ) { }

  onCloseMobileDetails(): void {
    this.router.navigate(['/apps', 'installed'], { state: { hideMobileDetails: true } });
  }
}
