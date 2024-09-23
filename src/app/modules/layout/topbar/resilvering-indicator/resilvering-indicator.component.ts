import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs/operators';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  ResilverProgressDialogComponent,
} from 'app/modules/layout/topbar/resilvering-indicator/resilver-progress/resilver-progress.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'ix-resilvering-indicator',
  styleUrls: ['./resilvering-indicator.component.scss'],
  templateUrl: './resilvering-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    TestIdModule,
    MatTooltip,
    IxIconComponent,
    AsyncPipe,
    TranslateModule,
  ],
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
