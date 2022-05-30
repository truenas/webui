import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-pools-dashboard',
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
})
export class PoolsDashboardComponent implements OnInit {
  selectedPool: Pool;
  constructor(
    private ws: WebSocketService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe(
      (pools: Pool[]) => {
        if (pools.length && pools.length > 0) {
          this.selectedPool = pools[0];
        }
      },
    );
  }

  navigateToDeviceManagement(): void {
    this.router.navigate(['/', 'storage2', 'pools', this.selectedPool.id, 'manage-devices']);
  }
}
