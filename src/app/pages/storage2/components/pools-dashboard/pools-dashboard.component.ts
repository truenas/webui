import {
  AfterViewInit, Component, OnInit, TemplateRef, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import { WebSocketService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';

@UntilDestroy()
@Component({
  selector: 'ix-pools-dashboard',
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
})
export class PoolsDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  selectedPool: Pool;
  pools: Pool[] = [];

  constructor(
    private ws: WebSocketService,
    private router: Router,
    private layoutService: LayoutService,
  ) {}

  ngOnInit(): void {
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe(
      (pools: Pool[]) => {
        this.pools = pools;
        if (pools.length && pools.length > 0) {
          this.selectedPool = pools[0];
        }
      },
    );
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  navigateToDeviceManagement(): void {
    this.router.navigate(['/', 'storage2', this.selectedPool.id, 'devices']);
  }
}
