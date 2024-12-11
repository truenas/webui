import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { EnclosureSideComponent } from 'app/pages/system/enclosure/components/enclosure-side/enclosure-side.component';
import {
  EnclosureSideSwitchComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-side-switch/enclosure-side-switch.component';
import {
  StatusViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/status-view/status-view.component';
import {
  StatusesLegendComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/status-view/statuses-legend/statuses-legend.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureSide } from 'app/pages/system/enclosure/utils/supported-enclosures';

describe('StatusViewComponent', () => {
  let spectator: Spectator<StatusViewComponent>;
  const createComponent = createComponentFactory({
    component: StatusViewComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        EnclosureSideComponent,
        EnclosureSideSwitchComponent,
        StatusesLegendComponent,
      ),
    ],
    providers: [
      mockProvider(EnclosureStore, {
        selectedEnclosure: () => ({}) as DashboardEnclosure,
        selectedSlot: () => ({}) as DashboardEnclosureSlot,
        selectedEnclosureSlots: () => ([]) as DashboardEnclosureSlot[],
        selectedSide: () => EnclosureSide.Front,
        hasMoreThanOneSide: () => true,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows status header', () => {
    expect(spectator.query('h2')).toHaveText('Status');
  });

  it('renders currently selected enclosure side', () => {
    expect(spectator.query(EnclosureSideComponent)).toExist();
  });

  it('renders switch to select enclosure side', () => {
    expect(spectator.query(EnclosureSideSwitchComponent)).toExist();
  });

  it('renders statuses legend', () => {
    expect(spectator.query(StatusesLegendComponent)).toExist();
  });
});
