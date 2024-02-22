import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { map } from 'rxjs/operators';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import {
  ResilverProgressDialogComponent,
} from 'app/modules/layout/components/topbar/resilvering-indicator/resilver-progress/resilver-progress.component';
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

  protected readonly tooltips = helptextTopbar.mat_tooltips;

  constructor(
    private matDialog: MatDialog,
    private ws: WebSocketService,
  ) {}

  showDetails(): void {
    this.matDialog.open(ResilverProgressDialogComponent);
  }
}
