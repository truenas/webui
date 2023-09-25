import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { Pool } from 'app/interfaces/pool.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
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
  unusedDisks: UnusedDisk[] = [];
  diskQuerySubscription: Subscription;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.updateUnusedDisks();
    this.subscribeToDiskQuery();
  }

  updateUnusedDisks(): void {
    this.ws.call('disk.get_unused').pipe(this.errorHandler.catchError(), untilDestroyed(this)).subscribe((disks) => {
      this.unusedDisks = disks;
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

  private unsubscribeFromDiskQuery(): void {
    if (!this.diskQuerySubscription || this.diskQuerySubscription.closed) {
      return;
    }
    this.diskQuerySubscription.unsubscribe();
  }
}
