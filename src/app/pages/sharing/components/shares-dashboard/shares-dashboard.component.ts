import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { sharesEmptyConfig } from 'app/constants/empty-configs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { NvmeOfCardComponent } from 'app/pages/sharing/components/shares-dashboard/nvme-of-card/nvme-of-card.component';
import { S3CardComponent } from 'app/pages/sharing/components/shares-dashboard/s3-card/s3-card.component';
import { sharesDashboardElements } from 'app/pages/sharing/components/shares-dashboard/shares-dashboard.elements';
import { WebShareCardComponent } from 'app/pages/sharing/components/shares-dashboard/webshare-card/webshare-card.component';
import { EntitlementsService } from 'app/services/entitlements.service';
import { poolStore } from 'app/services/global-store/stores.constant';
import { IscsiCardComponent } from './iscsi-card/iscsi-card.component';
import { NfsCardComponent } from './nfs-card/nfs-card.component';
import { SmbCardComponent } from './smb-card/smb-card.component';

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
    S3CardComponent,
    WebShareCardComponent,
    EmptyComponent,
    TranslateModule,
    PageHeaderComponent,
  ],
})
export class SharesDashboardComponent {
  private poolStoreService = inject(poolStore);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private entitlements = inject(EntitlementsService);

  protected readonly searchableElements = sharesDashboardElements;

  protected readonly requiredRoles = [Role.PoolWrite];

  emptyConfig: EmptyConfig = {
    ...sharesEmptyConfig,
    button: {
      label: this.translate.instant('Create Pool'),
      action: () => this.router.navigate(['/storage', 'create']),
    },
  };

  readonly pools = toSignal(this.poolStoreService.call.pipe(map((pools) => pools.length)), { initialValue: null });

  protected readonly shouldShowWebshare = this.entitlements.entitled(EntitlementFeature.Webshare);
}
