import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Pool } from 'app/interfaces/pool.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-pools-dashboard',
  templateUrl: './pools-dashboard.component.html',
  styleUrls: ['./pools-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolsDashboardComponent implements OnInit {
  pools: Pool[];
  constructor(
    private ws: WebSocketService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
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
