import {
  Component, ChangeDetectionStrategy, Input, ChangeDetectorRef, OnInit, OnDestroy,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  filter, switchMap, tap, map,
} from 'rxjs/operators';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { SnapshotCloneDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { DialogService, WebSocketService, AppLoaderService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-details-row',
  templateUrl: './snapshot-details-row.component.html',
  styleUrls: ['./snapshot-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotDetailsRowComponent implements OnInit, OnDestroy {
  @Input() snapshot: ZfsSnapshot;
  @Input() colspan: number;

  isLoading = true;
  isHold: boolean;
  snapshotInfo: ZfsSnapshot;

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getSnapshotInfo();
  }

  ngOnDestroy(): void {
    this.loader.close();
  }

  getSnapshotInfo(): void {
    this.ws.call('zfs.snapshot.query', [[['id', '=', this.snapshot.name]], { extra: { retention: true, holds: true } }]).pipe(
      map((snapshots) => snapshots[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (snapshot) => {
        this.snapshotInfo = snapshot;
        this.isHold = !_.isEmpty(snapshot.holds);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseWsError(error));
      },
    });
  }

  doHold(): void {
    if (!this.isHold) {
      this.ws.call('zfs.snapshot.hold', [this.snapshotInfo.name])
        .pipe(untilDestroyed(this)).subscribe(() => this.isHold = true);
    } else {
      this.ws.call('zfs.snapshot.release', [this.snapshotInfo.name])
        .pipe(untilDestroyed(this)).subscribe(() => this.isHold = false);
    }
  }

  doClone(snapshot: ZfsSnapshot): void {
    this.matDialog.open(SnapshotCloneDialogComponent, { data: snapshot.name });
  }

  doRollback(snapshot: ZfsSnapshot): void {
    this.matDialog.open(SnapshotRollbackDialogComponent, { data: snapshot.name });
  }

  doDelete(snapshot: ZfsSnapshot): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete snapshot {name}?', { name: snapshot.name }),
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.ws.call('zfs.snapshot.delete', [snapshot.name])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.loader.close();
      },
      error: (error: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.loader.close();
      },
    });
  }
}
