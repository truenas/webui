import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { sharesEmptyConfig } from 'app/constants/empty-configs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfCardComponent } from 'app/pages/sharing/components/shares-dashboard/nvme-of-card/nvme-of-card.component';
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
  imports: [
    UiSearchDirective,
    SmbCardComponent,
    NfsCardComponent,
    IscsiCardComponent,
    NvmeOfCardComponent,
    EmptyComponent,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class SharesDashboardComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private router = inject(Router);

  protected readonly searchableElements = sharesDashboardElements;

  protected readonly requiredRoles = [Role.PoolWrite];

  emptyConfig: EmptyConfig = {
    ...sharesEmptyConfig,
    button: {
      label: this.translate.instant('Create Pool'),
      action: () => this.router.navigate(['/storage', 'create']),
    },
  };

  readonly pools = toSignal(this.api.call('pool.query', [[], { count: true }]) as unknown as Observable<number>, { initialValue: null });
}
