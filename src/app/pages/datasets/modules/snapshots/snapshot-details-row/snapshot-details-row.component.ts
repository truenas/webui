import {
  Component, ChangeDetectionStrategy, Input, EventEmitter, Output, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, switchMap, tap, map,
} from 'rxjs/operators';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { SnapshotCloneDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { DialogService, WebSocketService, AppLoaderService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-details-row',
  templateUrl: './snapshot-details-row.component.html',
  styleUrls: ['./snapshot-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotDetailsRowComponent implements OnInit {
  @Input() snapshot: ZfsSnapshot;
  @Input() colspan: number;
  @Output() update = new EventEmitter<void>();

  isLoading = true;
  snapshotInfo: ZfsSnapshot;

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getSnapshotInfo();
  }

  getSnapshotInfo(): void {
    this.ws.call('zfs.snapshot.query', [[['id', '=', this.snapshot.name]], { extra: { retention: true } }]).pipe(
      map((snapshots) => snapshots[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (snapshot) => {
        this.snapshotInfo = snapshot;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    });
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
      buttonMsg: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      tap(() => this.loader.open()),
      switchMap(() => this.ws.call('zfs.snapshot.delete', [snapshot.name])),
      untilDestroyed(this),
    ).subscribe({
      next: () => this.loader.close(),
      error: (error: WebsocketError) => {
        this.dialogService.errorReportMiddleware(error);
        this.loader.close();
      },
    });
  }
}
