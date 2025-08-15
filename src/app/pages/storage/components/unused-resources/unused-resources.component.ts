import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, input, OnInit, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subscription, debounceTime, distinctUntilChanged,
} from 'rxjs';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ManageUnusedDiskDialog } from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UnusedDiskCardComponent } from './unused-disk-card/unused-disk-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-unused-resources',
  templateUrl: './unused-resources.component.html',
  styleUrls: ['./unused-resources.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [UnusedDiskCardComponent, TranslateModule],
})
export class UnusedResourcesComponent implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);
  private matDialog = inject(MatDialog);

  readonly pools = input.required<Pool[]>();

  noPoolsDisks: DetailsDisk[] = [];
  exportedPoolsDisks: DetailsDisk[] = [];
  diskQuerySubscription: Subscription;

  constructor() {
    effect(() => {
      if (this.pools()) {
        this.updateUnusedDisks();
      }
    });
  }

  ngOnInit(): void {
    this.subscribeToDiskQuery();
  }

  private updateUnusedDisks(): void {
    this.api.call('disk.details').pipe(
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe((diskDetails) => {
      this.noPoolsDisks = diskDetails.unused;
      this.exportedPoolsDisks = diskDetails.used.filter((disk) => disk.exported_zpool);
      this.cdr.markForCheck();
    });
  }

  private subscribeToDiskQuery(): void {
    this.unsubscribeFromDiskQuery();
    this.diskQuerySubscription = this.api.subscribe('disk.query')
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.updateUnusedDisks();
      });
  }

  protected addNoPoolDisksToStorage(): void {
    this.addUnusedDisksToStorage(this.noPoolsDisks);
  }

  protected addExportedPoolDisksToStorage(): void {
    this.addUnusedDisksToStorage(this.exportedPoolsDisks);
  }

  private addUnusedDisksToStorage(disks: DetailsDisk[]): void {
    this.matDialog.open(ManageUnusedDiskDialog, {
      data: {
        pools: this.pools(),
        unusedDisks: [...disks],
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
