import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { MatButton, MatAnchor } from '@angular/material/button';
import { Router, RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { StorageDashboardDisk } from 'app/interfaces/disk.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DashboardPoolComponent } from 'app/pages/storage/components/dashboard-pool/dashboard-pool.component';
import { ImportPoolComponent } from 'app/pages/storage/components/import-pool/import-pool.component';
import { UnusedResourcesComponent } from 'app/pages/storage/components/unused-resources/unused-resources.component';
import { storageElements } from 'app/pages/storage/pools-dashboard.elements';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { SlideInService } from 'app/services/slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-pools-dashboard',
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    UiSearchDirective,
    MatAnchor,
    RouterLink,
    DashboardPoolComponent,
    EmptyComponent,
    UnusedResourcesComponent,
    TranslateModule,
    AsyncPipe,
  ],
  providers: [
    PoolsDashboardStore,
  ],
})
export class PoolsDashboardComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  readonly searchableElements = storageElements;

  pools$ = this.store.pools$;
  allDisksByPool: Record<string, StorageDashboardDisk[]> = {};
  disks$ = this.store.disks$;

  rootDatasets: Record<string, Dataset> = {};
  arePoolsLoading = true;

  entityEmptyConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('No Pools'),
    message: `${this.translate.instant(
      'It seems you haven\'t configured pools yet.',
    )} ${this.translate.instant(
      'Please click the button below to create a pool.',
    )}`,
    button: {
      label: this.translate.instant('Create pool'),
      action: () => this.createPool(),
    },
  };

  arePoolsLoading$ = this.store.arePoolsLoading$;
  areDisksLoading$ = this.store.areDisksLoading$;

  isEmptyPools = false;

  constructor(
    protected router: Router,
    private slideInService: SlideInService,
    private cdr: ChangeDetectorRef,
    private store: PoolsDashboardStore,
    protected translate: TranslateService,
  ) { }

  ngOnInit(): void {
    this.pools$
      .pipe(untilDestroyed(this))
      .subscribe((pools) => {
        this.isEmptyPools = pools.length === 0;
        this.cdr.markForCheck();
      });

    this.store.rootDatasets$
      .pipe(untilDestroyed(this))
      .subscribe((rootDatasets) => {
        this.rootDatasets = rootDatasets;
        this.cdr.markForCheck();
      });

    this.arePoolsLoading$.pipe(untilDestroyed(this)).subscribe((loading) => {
      this.arePoolsLoading = loading;
    });

    this.store.loadDashboard();

    this.disks$.pipe(untilDestroyed(this)).subscribe((disks) => {
      for (const disk of disks) {
        if (!this.allDisksByPool[disk.pool]) {
          this.allDisksByPool[disk.pool] = [];
        }
        this.allDisksByPool[disk.pool].push(disk);
      }
    });
  }

  onImportPool(): void {
    const slideinRef = this.slideInService.open(ImportPoolComponent);
    slideinRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => this.store.loadDashboard());
  }

  createPool(): void {
    this.router.navigate(['/storage', 'create']);
  }

  getDisksForPool(pool: Pool): StorageDashboardDisk[] {
    return this.allDisksByPool[pool.name] || [];
  }
}
