import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnEmptyComponent } from '@truenas/ui-components';
import { storageEmptyConfig } from 'app/constants/empty-configs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { DashboardPoolComponent } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.component';
import { ImportPoolComponent } from 'app/pages/storage/components/import-pool/import-pool.component';
import { TierConfigFormComponent } from 'app/pages/storage/components/tier-config-form/tier-config-form.component';
import { UnusedResourcesComponent } from 'app/pages/storage/components/unused-resources/unused-resources.component';
import { storageElements } from 'app/pages/storage/pools-dashboard.elements';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-pools-dashboard',
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    UiSearchDirective,
    DashboardPoolComponent,
    TnEmptyComponent,
    UnusedResourcesComponent,
    TranslateModule,
  ],
  providers: [
    PoolsDashboardStore,
  ],
})
export class PoolsDashboardComponent implements OnInit {
  protected router = inject(Router);
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(PoolsDashboardStore);
  protected translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<AppState>>(Store);
  private tierService = inject(SharingTierService);
  private authService = inject(AuthService);

  protected readonly requiredRoles = [Role.PoolWrite];
  readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  readonly searchableElements = storageElements;

  protected readonly canCreatePool = toSignal(this.authService.hasRole(this.requiredRoles), { initialValue: false });
  protected readonly emptyTitle = storageEmptyConfig.title;
  protected readonly emptyDescription = this.translate.instant(storageEmptyConfig.message).replace(/<br>/g, ' ');

  rootDatasets: Record<string, Dataset> = {};

  readonly pools = this.store.pools;
  readonly arePoolsLoading = this.store.arePoolsLoading;
  readonly isLoadingPoolDetails = this.store.isLoadingPoolDetails;

  readonly hasNoPools = computed(() => this.pools().length === 0);

  ngOnInit(): void {
    this.store.rootDatasets$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((rootDatasets) => {
        this.rootDatasets = rootDatasets;
        this.cdr.markForCheck();
      });

    // Prime the shared tier config so child cards (pool-usage-card, vdevs-card)
    // can read tierService.tierEnabled directly without each subscribing.
    this.tierService.getTierConfig().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    this.store.loadDashboard();
  }

  protected createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  protected getDisksByPool(pool: Pool): StorageDashboardDisk[] {
    return this.store.disksByPool()[pool.name] || [];
  }

  protected onImportPool(): void {
    this.formPanel.open(ImportPoolComponent, {
      title: this.translate.instant('Import Pool'),
      footerless: true,
    }).onSuccess(() => this.store.loadDashboard(), this.destroyRef);
  }

  protected onTiering(): void {
    this.formPanel.open(TierConfigFormComponent, {
      title: this.translate.instant('Tiering'),
    }).onSuccess(() => {
      this.tierService.invalidate();
      // Re-prime so tierService.tierEnabled reflects the new config for child cards.
      this.tierService.getTierConfig().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
      this.store.loadDashboard();
    }, this.destroyRef);
  }
}
