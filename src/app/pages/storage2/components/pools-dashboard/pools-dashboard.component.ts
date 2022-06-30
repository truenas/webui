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
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
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
  volumeData: VolumesData;
  isPoolsLoading = false;
  isVolumeDataLoading = false;

  get isLoading(): boolean {
    return (this.isPoolsLoading || this.isVolumeDataLoading);
  }

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
    this.isPoolsLoading = true;
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe(
      (pools: Pool[]) => {
        this.pools = pools;
        this.isPoolsLoading = false;
        this.cdr.markForCheck();
      },
    );

    this.isVolumeDataLoading = true;
    this.ws.call('pool.dataset.query', [[], { extra: { retrieve_children: false } }]).pipe(untilDestroyed(this))
      .subscribe((datasets: Dataset[]) => {
        const vd: VolumesData = {};

        datasets.forEach((dataset) => {
          if (typeof dataset === undefined || !dataset) { return; }
          const usedPercent = dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed);
          const zvol = {
            avail: dataset.available.parsed,
            id: dataset.id,
            name: dataset.name,
            used: dataset.used.parsed,
            used_pct: (usedPercent * 100).toFixed(0) + '%',
          };
          vd[zvol.id] = zvol;
        });
        this.volumeData = vd;
        this.isVolumeDataLoading = false;
        this.cdr.markForCheck();
      });
  }
}
