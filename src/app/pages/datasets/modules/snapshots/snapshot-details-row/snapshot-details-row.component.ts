import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnInit, OnDestroy, input, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnTooltipDirective, TnDialog, TnButtonComponent, TnCheckboxComponent, TnDividerComponent,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { isEmpty } from 'lodash-es';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { toZfsSnapshot, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { SnapshotCloneDialog } from 'app/pages/datasets/modules/snapshots/snapshot-clone-dialog/snapshot-clone-dialog.component';
import { SnapshotRollbackDialog } from 'app/pages/datasets/modules/snapshots/snapshot-rollback-dialog/snapshot-rollback-dialog.component';
import { getFiniteNumber, getSnapshotCreationMs } from 'app/pages/datasets/modules/snapshots/utils/snapshot-creation.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-snapshot-details-row',
  templateUrl: './snapshot-details-row.component.html',
  styleUrls: ['./snapshot-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    NgxSkeletonLoaderModule,
    TranslateModule,
    FileSizePipe,
    FormatDateTimePipe,
    IxDateComponent,
    ReactiveFormsModule,
    TnCheckboxComponent,
    TnDividerComponent,
    TnButtonComponent,
    RequiresRolesDirective,
    TnTooltipDirective,
  ],
})
export class SnapshotDetailsRowComponent implements OnInit, OnDestroy {
  private dialogService = inject(DialogService);
  private api = inject(TypedApiService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);
  private loader = inject(LoaderService);
  private errorHandler = inject(ErrorHandlerService);
  private tnDialog = inject(TnDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly snapshot = input.required<ZfsSnapshot>();

  isLoading = true;
  snapshotInfo: ZfsSnapshot | undefined;
  /**
   * Disabled until the row knows whether the snapshot is held: a tick before then would be made
   * against a guess, and would be overwritten when the answer arrived.
   */
  holdControl = new FormControl({ value: false, disabled: true });

  protected readonly requiredRoles = [Role.SnapshotWrite];

  /**
   * Whether a dataset was cloned from this snapshot, which ZFS will not delete while one exists.
   * False until {@link checkForClones} answers, and if it fails: the lookup only spares the user
   * a delete middleware would refuse anyway.
   */
  protected hasClones = false;

  protected get usedBytes(): number | undefined {
    return getFiniteNumber(this.snapshotInfo?.properties?.used?.parsed);
  }

  protected get referencedBytes(): number | undefined {
    return getFiniteNumber(this.snapshotInfo?.properties?.referenced?.parsed);
  }

  protected get creationTimestampMs(): number | undefined {
    return getSnapshotCreationMs(this.snapshotInfo);
  }

  ngOnInit(): void {
    this.getSnapshotInfo();
    this.checkForClones();
    this.holdControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.doHoldOrRelease());
  }

  ngOnDestroy(): void {
    this.loader.close();
  }

  private getSnapshotInfo(): void {
    this.api.query('pool.snapshot.query', [['id', '=', this.snapshot().name]], {
      extra: {
        retention: true,
        holds: true,
        properties: ['creation', 'used', 'referenced'],
      },
    })
      .pipe(
        map((snapshots) => toZfsSnapshot(snapshots[0])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (snapshot) => {
          this.snapshotInfo = snapshot;
          this.holdControl.setValue(!isEmpty(snapshot.holds), { emitEvent: false });
          this.holdControl.enable({ emitEvent: false });
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

  /**
   * Asked of the datasets rather than of the snapshot: neither snapshot query returns a `clones`
   * property, whether or not it is requested, so a clone is only findable from its own side —
   * as the dataset whose `origin` is this snapshot.
   *
   * Only for a user who is shown Delete at all, and only for the one property the filter reads:
   * unfiltered by id, this walks every dataset, and it runs each time a row is opened.
   */
  private checkForClones(): void {
    this.authService.hasRole(this.requiredRoles).pipe(
      take(1),
      filter(Boolean),
      switchMap(() => this.api.query(
        'pool.dataset.query',
        [['origin.rawvalue', '=', this.snapshot().name]],
        { select: ['id'], extra: { properties: ['origin'] } },
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (clones) => {
        this.hasClones = clones.length > 0;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => console.error(error),
    });
  }

  private doHoldOrRelease(): void {
    const holdOrRelease = this.holdControl.value ? 'pool.snapshot.hold' : 'pool.snapshot.release';
    // The row's own name, not `snapshotInfo`'s: the tick box is live before that query answers.
    this.api.call(holdOrRelease, [this.snapshot().name])
      .pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => {
          this.holdControl.setValue(!this.holdControl.value, { emitEvent: false });
          this.errorHandler.showErrorModal(error);
        },
      });
  }

  doClone(snapshot: ZfsSnapshot): void {
    this.tnDialog.open(SnapshotCloneDialog, { data: snapshot.name });
  }

  doRollback(snapshot: ZfsSnapshot): void {
    // Prefer the fetched `snapshotInfo` (which carries the `creation` property)
    // so the dialog can render the timestamp without an extra round trip. The
    // parent list only fetches `properties` when `showSnapshotExtraColumns` is
    // on, so `snapshot` itself often won't have them and the dialog would have
    // to query — passing `snapshotInfo` short-circuits that round trip in the
    // common path.
    this.tnDialog.open(SnapshotRollbackDialog, { data: this.snapshotInfo ?? snapshot });
  }

  doDelete(snapshot: ZfsSnapshot): void {
    this.dialogService.confirmDelete({
      message: this.translate.instant('Delete snapshot {name}?', { name: snapshot.name }),
      call: () => this.api.call('pool.snapshot.delete', [snapshot.name]),
      successMessage: this.translate.instant('Snapshot deleted.'),
    // Deliberately not unsubscribing to make sure "Snapshot deleted" message is shown.
    }).subscribe();
  }
}
