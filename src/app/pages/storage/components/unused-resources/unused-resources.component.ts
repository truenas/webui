import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Subscription, debounceTime, distinctUntilChanged,
} from 'rxjs';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ManageUnusedDiskDialogComponent } from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-unused-resources',
  templateUrl: './unused-resources.component.html',
  styleUrls: ['./unused-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnusedResourcesComponent implements OnInit {
  @Input() pools: Pool[];
  unusedDisks: DetailsDisk[] = [];
  noPoolsDisks: DetailsDisk[] = [];
  exportedPoolsDisks: DetailsDisk[] = [];
  diskQuerySubscription: Subscription;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
  ) { }

  ngOnInit(): void {
    this.updateUnusedDisks();
    this.subscribeToDiskQuery();
  }

  updateUnusedDisks(): void {
    this.ws.call('disk.details').pipe(
      this.errorHandler.catchError(),
      untilDestroyed(this),
    ).subscribe((diskDetails) => {
      this.unusedDisks = diskDetails.unused;
      this.noPoolsDisks = diskDetails.unused;
      this.exportedPoolsDisks = diskDetails.used.filter((disk) => disk.exported_zpool);
      this.cdr.markForCheck();
    });
  }

  private subscribeToDiskQuery(): void {
    this.unsubscribeFromDiskQuery();
    this.diskQuerySubscription = this.ws.subscribe('disk.query')
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.updateUnusedDisks();
      });
  }

  protected addUnusedDisksToStorage(): void {
    this.matDialog.open(ManageUnusedDiskDialogComponent, {
      data: {
        pools: this.pools,
        unusedDisks: [...this.noPoolsDisks, ...this.exportedPoolsDisks],
      },
      width: '600px',
    });
  }

  private unsubscribeFromDiskQuery(): void {
    if (!this.diskQuerySubscription || this.diskQuerySubscription.closed) {
      return;
    }
    this.diskQuerySubscription.unsubscribe();
  }
}
