import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import { ImportPoolComponent } from 'app/pages/storage2/components/import-pool/import-pool.component';
import { PoolsDashboardStore } from 'app/pages/storage2/stores/pools-dashboard-store.service';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { StorageService } from 'app/services/storage.service';

@UntilDestroy()
@Component({
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  pools: Pool[];
  isPoolsLoading = false;

  constructor(
    private ws: WebSocketService,
    private layoutService: LayoutService,
    private slideIn: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private sorter: StorageService,
    private store: PoolsDashboardStore,
  ) {}

  ngOnInit(): void {
    this.loadPools();

    this.slideIn.onClose$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadPools());

    this.store.dashboardReloaded$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.loadPools());
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onImportPool(): void {
    this.slideIn.open(ImportPoolComponent);
  }

  loadPools(): void {
    // TODO: Add loading indicator
    // TODO: Handle error
    this.isPoolsLoading = true;
    this.ws.call('pool.query', [[], { extra: { is_upgraded: true } }]).pipe(untilDestroyed(this)).subscribe(
      (pools: Pool[]) => {
        this.pools = this.sorter.tableSorter(pools, 'name', 'asc');
        this.isPoolsLoading = false;
        this.cdr.markForCheck();
      },
    );
  }
}
