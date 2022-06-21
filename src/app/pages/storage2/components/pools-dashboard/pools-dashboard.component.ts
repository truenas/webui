import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-pools-dashboard',
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
})
export class PoolsDashboardComponent implements OnInit {
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
  ) {}

  ngOnInit(): void {
    this.isPoolsLoading = true;
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe(
      (pools: Pool[]) => {
        if (pools.length && pools.length > 0) {
          this.pools = pools;
        }
        this.isPoolsLoading = false;
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
      });
  }

  navigateToDeviceManagement(): void {
    this.router.navigate(['/', 'storage2', this.pools[0].id, 'devices']);
  }
}
