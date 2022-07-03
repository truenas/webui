import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { SmartTestResultStatus } from 'app/enums/smart-test-result-status.enum';
import { LoadingState, toLoadingState } from 'app/helpers/to-loading-state.helper';
import { SmartTestResult } from 'app/interfaces/smart-test.interface';
import { VDev } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-smart-info-card',
  templateUrl: './smart-info-card.component.html',
  styleUrls: ['./smart-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmartInfoCardComponent implements OnChanges {
  @Input() disk: VDev;

  totalResults$: Observable<LoadingState<number>>;

  private results$: Observable<SmartTestResult[]>;

  constructor(
    private ws: WebSocketService,
    private matDialog: MatDialog,
  ) { }

  ngOnChanges(): void {
    this.loadTestResults();
  }

  private loadTestResults(): void {
    this.results$ = this.ws.call('smart.test.results', [[['disk', '=', this.disk.disk]]])
      .pipe(map((results) => results[0]?.tests ?? []));
    this.totalResults$ = this.results$.pipe(
      map((results) => {
        return results.filter((result) => result.status !== SmartTestResultStatus.Running).length;
      }),
      toLoadingState(),
    );
  }
}
