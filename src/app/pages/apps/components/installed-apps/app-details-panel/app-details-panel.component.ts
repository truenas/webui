import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

@Component({
  selector: 'ix-app-details-panel',
  templateUrl: './app-details-panel.component.html',
  styleUrls: ['./app-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsPanelComponent {
  @Input() app: ChartRelease;
  @Input() status: AppStatus;
  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();

  constructor(
    private router: Router,
  ) { }

  onCloseMobileDetails(): void {
    this.router.navigate(['/apps', 'installed'], { state: { hideMobileDetails: true } });
  }
}
