import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
import { SmartTestResult } from 'app/interfaces/smart-test.interface';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import {
  ManualTestDialogComponent, ManualTestDialogParams,
} from 'app/pages/storage2/modules/disks/components/manual-test-dialog/manual-test-dialog.component';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-smart-info-card',
  templateUrl: './smart-info-card.component.html',
  styleUrls: ['./smart-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartInfoCardComponent implements OnChanges {
  @Input() topologyItem: VDev;
  @Input() disk: Disk;

  totalResults$: Observable<LoadingState<number>>;

  private results$: Observable<SmartTestResult[]>;

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
  ) { }

  ngOnChanges(): void {
    this.loadTestResults();
  }

  onManualTest(): void {
    const testDialog = this.matDialog.open(ManualTestDialogComponent, {
      data: {
        selectedDisks: [this.disk],
        diskIdsWithSmart: [this.disk.identifier],
      } as ManualTestDialogParams,
    });
    testDialog
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.loadTestResults();
      });
  }

  private loadTestResults(): void {
    this.results$ = this.ws.call('smart.test.results', [[['disk', '=', this.topologyItem.disk]]])
      .pipe(map((results) => results[0]?.tests ?? []));
    this.totalResults$ = this.results$.pipe(
      map((results) => {
        return results.filter((result) => result.status !== SmartTestResultStatus.Running).length;
      }),
      toLoadingState(),
    );
  }
}
