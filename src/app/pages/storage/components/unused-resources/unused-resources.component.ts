import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UUID } from 'angular2-uuid';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-unused-resources',
  templateUrl: './unused-resources.component.html',
  styleUrls: ['./unused-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnusedResourcesComponent implements OnInit, OnDestroy {
  @Input() pools: Pool[];
  unusedDisks: UnusedDisk[] = [];
  diskQuerySubscriptionId: string;

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.updateUnusedDisks();
    this.subscribeToDiskQuery();
  }

  ngOnDestroy(): void {
    this.unsubscribeFromDiskQuery();
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
    this.diskQuerySubscriptionId = UUID.UUID();
    this.ws.sub('disk.query', this.diskQuerySubscriptionId).pipe(untilDestroyed(this)).subscribe(() => {
      this.updateUnusedDisks();
    });
  }

  private unsubscribeFromDiskQuery(): void {
    if (!this.diskQuerySubscriptionId) {
      return;
    }
    this.ws.unsub('zfs.pool.scan', this.diskQuerySubscriptionId);
    this.diskQuerySubscriptionId = null;
  }
}
