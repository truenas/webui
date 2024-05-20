import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-dashboard',
  templateUrl: './enclosure-dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    EnclosureStore,
  ],
})
export class EnclosureDashboardComponent {
  readonly isJbofLicensed$ = this.ws.call('jbof.licensed');

  readonly selectedEnclosure = this.enclosureStore.selectedEnclosure;

  constructor(
    private enclosureStore: EnclosureStore,
    private route: ActivatedRoute,
    private ws: WebSocketService,
  ) {
    this.enclosureStore.initiate();

    this.route.paramMap.pipe(untilDestroyed(this)).subscribe((params) => {
      if (!params.has('enclosure')) {
        return;
      }

      this.enclosureStore.selectEnclosure(params.get('enclosure'));
      // TODO: Add error state for missing enclosure.
    });
  }
}
