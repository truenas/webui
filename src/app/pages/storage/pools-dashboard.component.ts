import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnEmptyComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
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
    RouterLink,
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
  private formPanel = inject(FormSidePanelService);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(PoolsDashboardStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<AppState>>(Store);
  private tierService = inject(SharingTierService);

  protected readonly requiredRoles = [Role.PoolWrite];
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly searchableElements = storageElements;

  protected readonly emptyTitle = T('No Pools');

  /**
   * The `<br>` markup is dead — `tn-empty` renders `description` as text — but it is part of the
   * translation key, so stripping it from the source string here would orphan the existing
   * translations. Strip it at render time instead, tolerating every spelling of the tag, and
   * collapse the newlines it left behind so no whitespace artifacts reach the accessibility tree.
   */
  private readonly emptyMessage = T('Storage features in TrueNAS require at least one Pool to exist. <br>\nA Pool is a group of disks working together to store and protect your data. <br>\nOnce you have a pool, this page will provide an overview of your pool’s health and status.');

  /** Re-translated on language change, which a plain `instant()` field initializer would miss. */
  private readonly currentLang = toSignal(this.translate.onLangChange, { initialValue: null });
  protected readonly emptyDescription = computed(() => {
    this.currentLang();
    return (this.translate.instant(this.emptyMessage) as string)
      .replace(/<br\s*\/?>/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  });

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
