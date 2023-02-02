import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription } from 'rxjs';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/services';
import { WebSocketService2 } from 'app/services/ws2.service';

@UntilDestroy()
@Component({
  selector: 'ix-unused-resources',
  templateUrl: './unused-resources.component.html',
  styleUrls: ['./unused-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnusedResourcesComponent implements OnInit {
  @Input() pools: Pool[];
  unusedDisks: UnusedDisk[] = [];
  diskQuerySubscription: Subscription;

  constructor(
    private ws: WebSocketService2,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.updateUnusedDisks();
    this.subscribeToDiskQuery();
  }

  updateUnusedDisks(): void {
    this.ws.call('disk.get_unused').pipe(untilDestroyed(this)).subscribe({
      next: (disks) => {
        this.unusedDisks = disks;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }

  private subscribeToDiskQuery(): void {
    this.unsubscribeFromDiskQuery();
    this.diskQuerySubscription = this.ws.subscribe('disk.query').pipe(untilDestroyed(this)).subscribe(() => {
      this.updateUnusedDisks();
    });
  }

  private unsubscribeFromDiskQuery(): void {
    if (!this.diskQuerySubscription || this.diskQuerySubscription.closed) {
      return;
    }
    this.diskQuerySubscription.unsubscribe();
  }
}
