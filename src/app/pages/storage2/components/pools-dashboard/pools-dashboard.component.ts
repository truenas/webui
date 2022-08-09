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

  pools$ = this.store.pools$;
  arePoolsLoading$ = this.store.isLoading$;

  constructor(
    private ws: WebSocketService,
    private layoutService: LayoutService,
    private slideIn: IxSlideInService,
    private cdr: ChangeDetectorRef,
    private sorter: StorageService,
    private store: PoolsDashboardStore,
  ) {}

  ngOnInit(): void {
    this.store.loadDashboard();

    this.slideIn.onClose$
      .pipe(untilDestroyed(this))
      .subscribe(() => this.store.loadDashboard());
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  onImportPool(): void {
    this.slideIn.open(ImportPoolComponent);
  }
}
