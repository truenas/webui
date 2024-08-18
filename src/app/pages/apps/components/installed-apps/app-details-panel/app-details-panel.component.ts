import {
  ChangeDetectionStrategy, Component, EventEmitter, input, Output,
} from '@angular/core';
import { App } from 'app/interfaces/app.interface';

@Component({
  selector: 'ix-app-details-panel',
  templateUrl: './app-details-panel.component.html',
  styleUrls: ['./app-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsPanelComponent {
  readonly app = input<App>();

  @Output() startApp = new EventEmitter<void>();
  @Output() stopApp = new EventEmitter<void>();
  @Output() closeMobileDetails = new EventEmitter<void>();

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
