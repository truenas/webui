import { Component, OnInit } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { ResilverData } from 'app/interfaces/resilver-job.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'app-resilver-progress-dialog',
  templateUrl: './resilver-progress.component.html',
  styleUrls: ['./resilver-progress.component.scss'],
})
export class ResilverProgressDialogComponent implements OnInit {
  tooltip: string;
  hideCancel = false;
  final = false;
  progressTotalPercent = 0;
  state: PoolScanState;
  resilveringDetails: ResilverData;
  title = T('Resilvering Status');
  description = T('Resilvering pool: ');
  statusLabel = T('Status: ');
  diskName: string;

  readonly PoolScanState = PoolScanState;

  constructor(
    protected translate: TranslateService,
    protected ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.ws.subscribe('zfs.pool.scan').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res && res.fields.scan.function.includes(PoolScanFunction.Resilver)) {
        this.resilveringDetails = res.fields;
        this.diskName = this.resilveringDetails.name;
        this.progressTotalPercent = this.resilveringDetails.scan.percentage;
        this.state = this.resilveringDetails.scan.state;
      }
    });
  }
}
