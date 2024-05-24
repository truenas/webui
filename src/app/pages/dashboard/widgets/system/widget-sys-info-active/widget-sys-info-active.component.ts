import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { selectUpdateJobForActiveNode } from 'app/modules/jobs/store/job.selectors';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { getSystemVersion } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import {
  selectEnclosureSupport, selectIsEnterprise, selectIsIxHardware,
} from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-widget-sys-info-active',
  templateUrl: './widget-sys-info-active.component.html',
  styleUrls: ['../common/widget-sys-info.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSysInfoActiveComponent {
  size = input.required<SlotSize>();

  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  hasEnclosureSupport = toSignal(this.store$.select(selectEnclosureSupport));
  isUpdateRunning = toSignal(this.store$.select(selectUpdateJobForActiveNode));

  updateAvailable = toSignal(this.resources.updateAvailable$);
  systemInfo = toSignal(this.resources.systemInfo$.pipe(
    filter((state) => !state.isLoading),
    map((state) => state.value),
  ));
  elapsedSeconds = toSignal(this.resources.fiveSecondsRefreshInterval$.pipe(
    map((iteration) => (iteration ? iteration * 5 : 0)),
  ));

  version = computed(() => getSystemVersion(this.systemInfo().version, this.systemInfo().codename));
  uptime = computed(() => this.systemInfo().uptime_seconds + this.elapsedSeconds());
  datetime = computed(() => this.systemInfo().datetime.$date + (this.elapsedSeconds() * 1000));
  isLoaded = computed(() => this.systemInfo());

  constructor(
    private resources: WidgetResourcesService,
    private store$: Store<AppState>,
  ) {
    this.resources.refreshSystemInfo();
  }
}
