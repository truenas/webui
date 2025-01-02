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
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-resilvering-indicator',
  styleUrls: ['./resilvering-indicator.component.scss'],
  templateUrl: './resilvering-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class ResilveringIndicatorComponent {
  protected isResilvering$ = this.api.subscribe('zfs.pool.scan').pipe(
    map((event) => {
      const scan = event.fields.scan;
      return scan.function === PoolScanFunction.Resilver && scan.state !== PoolScanState.Finished;
    }),
  );

  protected readonly tooltips = helptextTopbar.mat_tooltips;

  constructor(
    private matDialog: MatDialog,
    private api: ApiService,
  ) {}

  showDetails(): void {
    this.matDialog.open(ResilverProgressDialogComponent);
  }
}
