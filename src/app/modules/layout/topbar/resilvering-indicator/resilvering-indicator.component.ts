import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialog, TnIconButtonComponent } from '@truenas/ui-components';
import { filter, map } from 'rxjs/operators';
import { PoolScanFunction } from 'app/enums/pool-scan-function.enum';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { poolScanFromEvent } from 'app/helpers/pool-scan-event.helper';
import { helptextTopbar } from 'app/helptext/topbar';
import {
  ResilverProgressDialog,
} from 'app/modules/layout/topbar/resilvering-indicator/resilver-progress/resilver-progress.component';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';

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
  private api = inject(TypedApiService);

  protected isResilvering$ = this.api.subscribe('pool.scan').pipe(
    map(poolScanFromEvent),
    filter((poolScan) => poolScan !== null),
    map(({ scan }) => scan.function === PoolScanFunction.Resilver && scan.state !== PoolScanState.Finished),
  );

  protected readonly tooltips = helptextTopbar.tooltips;

  showDetails(): void {
    this.tnDialog.open(ResilverProgressDialog);
  }
}
