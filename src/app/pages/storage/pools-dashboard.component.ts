import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnEmptyComponent, TnTestIdDirective } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { helptextImport } from 'app/helptext/storage/volumes/volume-import-wizard';
import { Dataset } from 'app/interfaces/dataset.interface';
import { StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { DashboardPoolComponent } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.component';
import { ImportPoolComponent } from 'app/pages/storage/components/import-pool/import-pool.component';
import { TierConfigFormComponent } from 'app/pages/storage/components/tier-config-form/tier-config-form.component';
import { UnusedResourcesComponent } from 'app/pages/storage/components/unused-resources/unused-resources.component';
import { storageElements } from 'app/pages/storage/pools-dashboard.elements';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { EntitlementsService } from 'app/services/entitlements.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-pools-dashboard',
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    RouterLink,
    TnButtonComponent,
    TnTestIdDirective,
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
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(PoolsDashboardStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<AppState>>(Store);
  private tierService = inject(SharingTierService);
  private entitlements = inject(EntitlementsService);

  protected readonly requiredRoles = [Role.PoolWrite];
  protected readonly hasZfsTier = this.entitlements.entitled(EntitlementFeature.ZfsTier);
  protected readonly searchableElements = storageElements;

  protected readonly emptyTitle = T('No Pools');

  /**
   * The pre-migration copy carried `<br>` markup for its line breaks, which `tn-empty` — it
   * renders `description` as text — would have shown verbatim. Re-keyed without the tags rather
   * than stripped at render time: extraction is automated and the locale files are generated, so
   * this costs one re-translation instead of a permanently misleading source string plus a
   * regex on every render. Run `yarn translations` to pick the new key up.
   *
   * The three sentences run together as one paragraph now that the breaks are gone.
   * `.tn-empty__description` caps itself at 420px and centres, so it still wraps to a short,
   * readable column rather than a single full-width line — no extra styling needed here.
   */
  protected readonly emptyMessage = T('Storage features in TrueNAS require at least one Pool to exist. A Pool is a group of disks working together to store and protect your data. Once you have a pool, this page will provide an overview of your pool’s health and status.');

  protected rootDatasets: Record<string, Dataset> = {};

  protected readonly pools = this.store.pools;
  protected readonly arePoolsLoading = this.store.arePoolsLoading;
  protected readonly isLoadingPoolDetails = this.store.isLoadingPoolDetails;

  protected readonly hasNoPools = computed(() => this.pools().length === 0);

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

  protected getDisksByPool(pool: Pool): StorageDashboardDisk[] {
    return this.store.disksByPool()[pool.name] || [];
  }

  protected onImportPool(): void {
    this.formPanel.open(ImportPoolComponent, {
      title: this.translate.instant(helptextImport.title),
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
