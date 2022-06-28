import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import { ImportPoolComponent } from 'app/pages/storage2/components/import-pool/import-pool.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  pools: Pool[];
  constructor(
    private ws: WebSocketService,
    private router: Router,
    private layoutService: LayoutService,
    private slideIn: IxSlideInService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadPools();

    this.slideIn.onClose$
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
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe(
      (pools: Pool[]) => {
        this.pools = pools;
        this.cdr.markForCheck();
      },
    );
  }
}
