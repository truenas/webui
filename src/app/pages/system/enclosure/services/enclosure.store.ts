import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { produce } from 'immer';
import { chain } from 'lodash';
import { Subject, switchMap, tap } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EnclosureElementType, DriveBayLightStatus } from 'app/enums/enclosure-slot-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { DashboardEnclosure, EnclosureVdevDisk } from 'app/interfaces/enclosure.interface';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { getEnclosureLabel } from 'app/pages/system/enclosure/utils/get-enclosure-label.utils';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';

export interface EnclosureState {
  enclosures: DashboardEnclosure[];
  isLoading: boolean;
  selectedEnclosureIndex: number;
  selectedSlotNumber: number;
  selectedView: EnclosureView;
  selectedSide: EnclosureSide;
}

const initialState: EnclosureState = {
  isLoading: true,
  enclosures: [],
  selectedEnclosureIndex: 0,
  selectedSlotNumber: null,
  selectedView: EnclosureView.Pools,
  selectedSide: undefined, // Undefined means front or top and will be picked in EnclosureSideComponent.
};

@UntilDestroy()
@Injectable()
export class EnclosureStore extends ComponentStore<EnclosureState> {
  readonly stateAsSignal = toSignal(
    this.state$,
    { initialValue: initialState },
  );

  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly selectedSlot = computed(() => {
    if (this.stateAsSignal().selectedSlotNumber === null || !this.selectedEnclosure()) {
      return undefined;
    }

    const elements = this.selectedEnclosure().elements[EnclosureElementType.ArrayDeviceSlot];
    return elements[this.stateAsSignal().selectedSlotNumber];
  });
  readonly selectedEnclosure = computed(() => {
    const state = this.stateAsSignal();
    return state.enclosures[state.selectedEnclosureIndex];
  });
  readonly selectedEnclosureSlots = computed(() => {
    const slots = this.selectedEnclosure()?.elements?.[EnclosureElementType.ArrayDeviceSlot] || {};
    return Object.values(slots);
  });
  readonly selectedView = computed(() => this.stateAsSignal().selectedView);
  readonly selectedSide = computed(() => this.stateAsSignal().selectedSide);
  readonly enclosures = computed(() => this.stateAsSignal().enclosures);

  readonly poolColors = computed<Record<string, string>>(() => {
    const poolNames = chain(this.enclosures())
      .flatMap((enclosure) => Object.values(enclosure.elements[EnclosureElementType.ArrayDeviceSlot]))
      .filter((slot) => Boolean(slot.pool_info?.pool_name))
      .map((slot) => slot.pool_info.pool_name)
      .uniq();

    return poolNames
      .map((poolName, index) => {
        return [poolName, this.theme.getRgbBackgroundColorByIndex(index)];
      })
      .fromPairs()
      .value();
  });

  readonly enclosureLabel = computed(() => getEnclosureLabel(this.selectedEnclosure()));

  private disksUpdateSubscriptionId: string;

  constructor(
    private ws: WebSocketService,
    private disksUpdateService: DisksUpdateService,
    private errorHandler: ErrorHandlerService,
    private theme: ThemeService,
  ) {
    super(initialState);
  }

  initiate = this.effect((origin$) => {
    return origin$.pipe(
      tap(() => this.setState(initialState)),
      switchMap(() => {
        return this.ws.call('webui.enclosure.dashboard').pipe(
          tap((enclosures: DashboardEnclosure[]) => {
            this.patchState({ enclosures });
          }),
          this.errorHandler.catchError(),
          finalize(() => {
            this.patchState({ isLoading: false });
          }),
        );
      }),
    );
  });

  update = this.effect((origin$) => {
    return origin$.pipe(
      switchMap(() => {
        return this.ws.call('webui.enclosure.dashboard').pipe(
          tap((enclosures: DashboardEnclosure[]) => {
            this.patchState({ enclosures });
          }),
          this.errorHandler.catchError(),
        );
      }),
    );
  });

  addListenerForDiskUpdates(): void {
    if (!this.disksUpdateSubscriptionId) {
      const diskUpdatesTrigger$ = new Subject<Disk[]>();
      this.disksUpdateSubscriptionId = this.disksUpdateService.addSubscriber(diskUpdatesTrigger$, true);
      diskUpdatesTrigger$.pipe(untilDestroyed(this)).subscribe(() => this.update());
    }
  }

  removeListenerForDiskUpdates(): void {
    this.disksUpdateService.removeSubscriber(this.disksUpdateSubscriptionId);
  }

  selectEnclosure = this.updater((state, id: string) => {
    const index = state.enclosures.findIndex((enclosure) => enclosure.id === id);

    if (index === state.selectedEnclosureIndex) {
      return state;
    }

    return {
      ...state,
      selectedEnclosureIndex: index,
      selectedSlotNumber: null,
      selectedSide: undefined,
      selectedView: EnclosureView.Pools,
    };
  });

  renameSelectedEnclosure = this.updater((state, label: string) => {
    const enclosures = [...state.enclosures];
    enclosures[state.selectedEnclosureIndex] = {
      ...enclosures[state.selectedEnclosureIndex],
      label,
    };

    return {
      ...state,
      enclosures,
    };
  });

  selectSlot = this.updater((state, slotNumber: number) => {
    return {
      ...state,
      selectedSlotNumber: slotNumber,
    };
  });

  selectSlotByVdevDisk(vdevDisk: EnclosureVdevDisk): void {
    this.selectEnclosure(vdevDisk.enclosure_id);
    this.selectSlot(vdevDisk.slot);
  }

  selectView = this.updater((state, view: EnclosureView) => {
    return {
      ...state,
      selectedView: view,
    };
  });

  selectSide = this.updater((state, side: EnclosureSide) => {
    if (side === state.selectedSide) {
      return state;
    }

    return {
      ...state,
      selectedSide: side,
      selectedSlotNumber: null,
    };
  });

  changeLightStatus = this.updater((state, options: {
    enclosureId: string;
    driveBayNumber: number;
    status: DriveBayLightStatus;
  }) => {
    return produce(state, (draft) => {
      const enclosureToUpdate = draft.enclosures.find((enclosure) => enclosure.id === options.enclosureId);
      const driveBay = enclosureToUpdate.elements[EnclosureElementType.ArrayDeviceSlot][options.driveBayNumber];
      driveBay.drive_bay_light_status = options.status;
    });
  });
}
