import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { sharesDashboardElements } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.elements';
import { IscsiCardComponent } from './iscsi-card/iscsi-card.component';
import { NfsCardComponent } from './nfs-card/nfs-card.component';
import { SmbCardComponent } from './smb-card/smb-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-shares-dashboard',
  templateUrl: './shares-dashboard.component.html',
  styleUrls: ['./shares-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    UiSearchDirective,
    SmbCardComponent,
    NfsCardComponent,
    IscsiCardComponent,
  ],
})
export class SharesDashboardComponent {
  protected readonly searchableElements = sharesDashboardElements;
}
