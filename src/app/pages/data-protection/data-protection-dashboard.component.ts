import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  templateUrl: './data-protection-dashboard.component.html',
  styleUrls: ['./data-protection-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataProtectionDashboardComponent {
}
