import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { MatProgressBar } from '@angular/material/progress-bar';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { PoolScan } from 'app/interfaces/resilver-job.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-resilver-progress',
  templateUrl: './resilver-progress.component.html',
  styleUrls: ['./resilver-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatProgressBar,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    DecimalPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class ResilverProgressDialog implements OnInit {
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  tooltip: string;
  hideCancel = false;
  final = false;
  progressTotalPercent = 0;
  state: PoolScanState;
  resilveringDetails: PoolScan;
  title = this.translate.instant('Resilvering Status');
  description = this.translate.instant('Resilvering pool: ');
  statusLabel = this.translate.instant('Status: ');
  diskName: string;

  readonly PoolScanState = PoolScanState;

  ngOnInit(): void {
    this.api.subscribe('pool.scan').pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (!event || !event.fields.scan.function.includes(PoolScanFunction.Resilver)) {
        return;
      }

      this.resilveringDetails = event.fields;
      this.diskName = this.resilveringDetails.name;
      this.progressTotalPercent = this.resilveringDetails.scan.percentage;
      this.state = this.resilveringDetails.scan.state;
      this.cdr.markForCheck();
    });
  }
}
