import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { sharesDashboardElements } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.elements';

@UntilDestroy()
@Component({
  templateUrl: './shares-dashboard.component.html',
  styleUrls: ['./shares-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharesDashboardComponent {
  protected readonly searchableElements = sharesDashboardElements;
}
