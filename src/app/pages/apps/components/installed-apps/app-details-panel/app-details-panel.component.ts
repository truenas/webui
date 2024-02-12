import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
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
  @Output() closeMobileDetails = new EventEmitter<void>();

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
