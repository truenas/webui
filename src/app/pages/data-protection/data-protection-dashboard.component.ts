import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { dataProtectionDashboardElements } from 'app/pages/data-protection/data-protection-dashboard.elements';

@UntilDestroy()
@Component({
  selector: 'ix-data-protection-dashboard',
  templateUrl: './data-protection-dashboard.component.html',
  styleUrls: ['./data-protection-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataProtectionDashboardComponent {
  protected readonly searchableElements = dataProtectionDashboardElements;
}
