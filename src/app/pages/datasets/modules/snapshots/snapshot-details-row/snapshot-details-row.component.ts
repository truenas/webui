import {
  Component, ChangeDetectionStrategy, Input, ChangeDetectorRef, OnInit, OnDestroy,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  filter, switchMap, tap, map,
} from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { SnapshotCloneDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { ZfsSnapshotUi } from 'app/pages/datasets/modules/snapshots/snapshot-list/snapshot-list.component';
import { SnapshotRollbackDialogComponent } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-details-row',
  templateUrl: './snapshot-details-row.component.html',
  styleUrls: ['./snapshot-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotDetailsRowComponent implements OnInit, OnDestroy {
  @Input() snapshot: ZfsSnapshotUi;

  isLoading = true;
  snapshotInfo: ZfsSnapshotUi;
  holdControl = new FormControl(false);

  protected readonly requiredRoles = [Role.FullAdmin];

  get hasClones(): boolean {
    return !!this.snapshotInfo?.properties?.clones?.value;
  }

  constructor(
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.getSnapshotInfo();
    this.holdControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe(() => this.doHoldOrRelease());
  }

  ngOnDestroy(): void {
    this.loader.close();
  }

  getSnapshotInfo(): void {
    this.ws.call(
      'zfs.snapshot.query',
      [
        [['id', '=', this.snapshot.name]], {
          extra: {
            retention: true,
            holds: true,
          },
        },
      ],
    )
      .pipe(
        map((snapshots) => ({ ...snapshots[0], selected: this.snapshot.selected })),
        untilDestroyed(this),
      )
      .subscribe({
        next: (snapshot) => {
          this.snapshotInfo = snapshot;
          this.holdControl.setValue(!_.isEmpty(snapshot.holds), { emitEvent: false });
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  doHoldOrRelease(): void {
    const holdOrRelease = this.holdControl.value ? 'zfs.snapshot.hold' : 'zfs.snapshot.release';
    this.ws.call(holdOrRelease, [this.snapshotInfo.name])
      .pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        error: (error: unknown) => {
          this.holdControl.setValue(!this.holdControl.value, { emitEvent: false });
          this.errorHandler.showErrorModal(error);
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
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('zfs.snapshot.delete', [snapshot.name]).pipe(
          this.loader.withLoader(),
          this.errorHandler.catchError(),
          tap(() => {
            this.snackbar.success(this.translate.instant('Snapshot deleted.'));
          }),
        );
      }),
    // Deliberately not unsubscribing to make sure "Snapshot deleted" message is shown.
    // eslint-disable-next-line rxjs-angular/prefer-takeuntil
    ).subscribe();
  }
}
