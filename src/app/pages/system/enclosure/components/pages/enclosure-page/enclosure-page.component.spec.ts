import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import {
  EnclosureHeaderComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import {
  EnclosurePageComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-page.component';
import {
  EnclosureSelectorComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-selector/enclosure-selector.component';
import {
  DisksOverviewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disks-overview/disks-overview.component';
import {
  EnclosureViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/enclosure-view.component';
import {
  SasExpanderStatusViewComponent,
} from 'app/pages/system/enclosure/components/pages/enclosure-page/sas-expander-status-view/sas-expander-status-view.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';

describe('EnclosurePageComponent', () => {
  let spectator: Spectator<EnclosurePageComponent>;
  const selectedView = signal(EnclosureView.Expanders);
  const selectedEnclosure = signal({ id: '123' } as DashboardEnclosure);
  const createComponent = createComponentFactory({
    component: EnclosurePageComponent,
    declarations: [
      MockComponents(
        SasExpanderStatusViewComponent,
        EnclosureViewComponent,
        DisksOverviewComponent,
        EnclosureSelectorComponent,
        EnclosureHeaderComponent,
      ),
    ],
    providers: [
      mockProvider(Router),
      mockProvider(EnclosureStore, {
        selectedEnclosure,
        selectedView,
        enclosureLabel: () => 'M40',
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows expander status for expander view', () => {
    const expanderView = spectator.query(SasExpanderStatusViewComponent);
    expect(expanderView).toExist();
  });

  it('shows enclosure view when it is selected', () => {
    selectedView.set(EnclosureView.Pools);
    spectator.detectChanges();

    expect(spectator.query(EnclosureViewComponent)).toExist();
  });

  it('shows enclosure selector', () => {
    expect(spectator.query(EnclosureSelectorComponent)).toExist();
  });

  it('shows disks overview', () => {
    expect(spectator.query(DisksOverviewComponent)).toExist();
  });

  it('redirects to a separate MINI page when selected enclosure is a MINI', () => {
    selectedEnclosure.set({
      id: '123',
      model: EnclosureModel.Mini3X,
    } as DashboardEnclosure);
    spectator.detectChanges();

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system', 'viewenclosure', '123', 'mini']);
  });
});
