import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { StorageDashboardDisk } from 'app/interfaces/storage.interface';
import { ImportPoolComponent } from 'app/pages/storage/components/import-pool/import-pool.component';
import { PoolsDashboardStore } from 'app/pages/storage/stores/pools-dashboard-store.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolsDashboardComponent implements OnInit {
  pools$ = this.store.pools$;
  allDisksByPool: { [pool: string]: StorageDashboardDisk[] } = {};
  disks$ = this.store.disks$;

  rootDatasets: { [key: string]: Dataset } = {};

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
    private slideInService: IxSlideInService,
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

    this.store.loadDashboard();
    this.store.listenForPoolUpdates()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.store.loadDashboard();
      });

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
    return this.allDisksByPool[pool.name];
  }
}
