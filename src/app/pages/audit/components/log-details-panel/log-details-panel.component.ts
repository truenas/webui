import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'ix-log-details-panel',
  templateUrl: './log-details-panel.component.html',
  styleUrls: ['./log-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogDetailsPanelComponent {
  constructor(private router: Router) {}

  onCloseMobileDetails(): void {
    this.router.navigate(['/audit'], { state: { hideMobileDetails: true } });
  }
}
