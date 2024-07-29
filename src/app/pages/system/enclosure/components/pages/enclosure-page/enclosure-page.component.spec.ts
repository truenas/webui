import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { unsupportedEnclosureMock } from 'app/constants/server-series.constant';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { DashboardEnclosure, DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import {
  EnclosureHeaderComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import {
  DiskDetailsOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/disk-details-overview/disk-details-overview.component';
import {
  DisksOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/disks-overview/disks-overview.component';
import {
  EnclosurePageComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-page.component';
import {
  EnclosureSelectorComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-selector/enclosure-selector.component';
import {
  PoolsViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/pools-view/pools-view.component';
import {
  SasExpanderStatusViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/sas-expander-status-view/sas-expander-status-view.component';
import {
  StatusViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/status-view/status-view.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

describe('EnclosurePageComponent', () => {
  let spectator: Spectator<EnclosurePageComponent>;
  const selectedView = signal(EnclosureView.Expanders);
  const selectedEnclosure = signal({ id: '123' } as DashboardEnclosure);
  const selectedSlot = signal({} as DashboardEnclosureSlot);
  const isLoading = signal(true);
  const createComponent = createComponentFactory({
    component: EnclosurePageComponent,
    declarations: [
      MockComponents(
        SasExpanderStatusViewComponent,
        PoolsViewComponent,
        DisksOverviewComponent,
        EnclosureSelectorComponent,
        EnclosureHeaderComponent,
        FakeProgressBarComponent,
        StatusViewComponent,
        DiskDetailsOverviewComponent,
      ),
    ],
    providers: [
      mockProvider(Router),
      mockProvider(EnclosureStore, {
        selectedEnclosure,
        selectedView,
        selectedSlot,
        isLoading,
        enclosureLabel: () => 'M40',
      }),
    ],
  });

  beforeEach(() => {
    selectedSlot.set({} as DashboardEnclosureSlot);
    spectator = createComponent();
  });

  it('should not show progress bar when not loading', () => {
    isLoading.set(false);
    spectator.detectChanges();
    expect(spectator.query(FakeProgressBarComponent)).toBeFalsy();
  });

  it('shows expander status for expander view', () => {
    const expanderView = spectator.query(SasExpanderStatusViewComponent);
    expect(expanderView).toExist();
  });

  it('shows enclosure view when it is selected', () => {
    selectedView.set(EnclosureView.Pools);
    spectator.detectChanges();

    expect(spectator.query(PoolsViewComponent)).toExist();
  });

  it('shows enclosure selector', () => {
    expect(spectator.query(EnclosureSelectorComponent)).toExist();
  });

  it('shows disks overview when no slot is selected', () => {
    selectedSlot.set(null);
    spectator.detectChanges();

    expect(spectator.query(DisksOverviewComponent)).toExist();
  });

  it('shows disk details overview is selected', () => {
    expect(spectator.query(DiskDetailsOverviewComponent)).toExist();
  });

  it('redirects to a separate MINI page when selected enclosure is a MINI', () => {
    selectedEnclosure.set({
      id: '123',
      model: EnclosureModel.Mini3X,
    } as DashboardEnclosure);
    spectator.detectChanges();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system', 'viewenclosure', '123', 'mini']);
  });

  it('should display the supported enclosure view when model is supported', () => {
    selectedView.set(EnclosureView.Pools);
    spectator.detectChanges();

    expect(spectator.query(PoolsViewComponent)).toBeTruthy();
    expect(spectator.query(EnclosureHeaderComponent)).toBeTruthy();
    expect(spectator.query(EnclosureSelectorComponent)).toBeTruthy();
    expect(spectator.query('.not-supported')).toBeFalsy();
  });

  it('should display the unsupported enclosure message when model is not supported', () => {
    selectedEnclosure.set(unsupportedEnclosureMock);
    spectator.detectChanges();

    expect(spectator.query('.not-supported')).toBeTruthy();
    expect(spectator.query('.not-supported h2').textContent).toBe('Enclosure is not supported');
    expect(spectator.query(PoolsViewComponent)).toBeFalsy();
    expect(spectator.query(EnclosureHeaderComponent)).toBeFalsy();
    expect(spectator.query(EnclosureSelectorComponent)).toBeFalsy();
  });
});
