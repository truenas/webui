import {
  ChangeDetectionStrategy, Component, computed,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { DriveBayLightStatus } from 'app/enums/enclosure-slot-status.enum';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-identify-light',
  templateUrl: './identify-light.component.html',
  styleUrls: ['./identify-light.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IdentifyLightComponent {
  protected readonly isStatusKnown = computed(() => Boolean(this.status()));
  protected readonly status = computed(() => this.store.selectedSlot().drive_bay_light_status);

  protected readonly DriveBayLightStatus = DriveBayLightStatus;

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private store: EnclosureStore,
  ) {}

  protected changeLightStatus(newStatus: DriveBayLightStatus): void {
    const slot = this.store.selectedSlot();
    const enclosure = this.store.selectedEnclosure();
    const oldStatus = this.status();

    this.store.changeLightStatus({
      status: newStatus,
      enclosureId: enclosure.id,
      driveBayNumber: slot.drive_bay_number,
    });

    this.ws.call('enclosure2.set_slot_status', [{
      status: newStatus,
      enclosure_id: enclosure.id,
      slot: slot.drive_bay_number,
    }])
      .pipe(
        catchError((error) => {
          this.errorHandler.showErrorModal(error);
          this.store.changeLightStatus({
            status: oldStatus,
            enclosureId: enclosure.id,
            driveBayNumber: slot.drive_bay_number,
          });

          return EMPTY;
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }
}
