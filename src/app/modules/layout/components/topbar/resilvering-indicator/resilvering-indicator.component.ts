import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import helptext from 'app/helptext/topbar';
import {
  ResilverProgressDialogComponent,
} from 'app/modules/common/dialog/resilver-progress/resilver-progress.component';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'ix-resilvering-indicator',
  styleUrls: ['./resilvering-indicator.component.scss'],
  templateUrl: './resilvering-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResilveringIndicatorComponent {
  protected isResilvering$ = this.ws.subscribe('zfs.pool.scan').pipe(
    map((event) => {
      const scan = event.fields.scan;
      return scan.function === PoolScanFunction.Resilver && scan.state !== PoolScanState.Finished;
    }),
  );

  protected readonly tooltips = helptext.mat_tooltips;

  constructor(
    private dialog: MatDialog,
    private ws: WebSocketService,
  ) {}

  showDetails(): void {
    this.dialog.open(ResilverProgressDialogComponent);
  }
}
