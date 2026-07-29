import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialog, TnIconButtonComponent } from '@truenas/ui-components';
import { map } from 'rxjs/operators';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { helptextTopbar } from 'app/helptext/topbar';
import {
  ResilverProgressDialog,
} from 'app/modules/layout/topbar/resilvering-indicator/resilver-progress/resilver-progress.component';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-resilvering-indicator',
  styleUrls: ['./resilvering-indicator.component.scss'],
  templateUrl: './resilvering-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    AsyncPipe,
    TranslateModule,
  ],
})
export class ResilveringIndicatorComponent {
  private tnDialog = inject(TnDialog);
  private api = inject(ApiService);

  protected isResilvering$ = this.api.subscribe('pool.scan').pipe(
    map((event) => {
      const scan = event.fields.scan;
      return scan.function === PoolScanFunction.Resilver && scan.state !== PoolScanState.Finished;
    }),
  );

  protected readonly tooltips = helptextTopbar.tooltips;

  showDetails(): void {
    this.tnDialog.open(ResilverProgressDialog);
  }
}
