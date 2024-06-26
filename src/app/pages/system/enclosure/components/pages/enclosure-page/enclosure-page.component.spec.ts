import { MatProgressBar } from '@angular/material/progress-bar';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { EnclosureHeaderComponent } from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { EnclosureSelectorComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-selector/enclosure-selector.component';
import { DisksOverviewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/disks-overview/disks-overview.component';
import { EnclosureViewComponent } from 'app/pages/system/enclosure/components/pages/enclosure-page/enclosure-view/enclosure-view.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';
import { EnclosureView } from 'app/pages/system/enclosure/types/enclosure-view.enum';
import { EnclosurePageComponent } from './enclosure-page.component';

describe('EnclosurePageComponent', () => {
  let spectator: Spectator<EnclosurePageComponent>;
  const createComponent = createComponentFactory({
    component: EnclosurePageComponent,
    declarations: [
      MockComponent(DisksOverviewComponent),
      MockComponent(EnclosureSelectorComponent),
      MockComponent(EnclosureHeaderComponent),
      MockComponent(EnclosureViewComponent),
      MockComponent(MatProgressBar),
    ],
  });

  describe('supported enclosure model', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(EnclosureStore, {
            selectedEnclosure: jest.fn(() => ({ model: 'M50', label: 'Enclosure 1' })),
            selectedView: jest.fn(() => EnclosureView.Pools),
            enclosureLabel: jest.fn(() => 'Enclosure 1'),
            isLoading: jest.fn(() => false),
          }),
        ],
      });
    });

    it('should display the supported enclosure view when model is supported', () => {
      expect(spectator.query(EnclosureViewComponent)).toBeTruthy();
      expect(spectator.query(EnclosureHeaderComponent)).toBeTruthy();
      expect(spectator.query(EnclosureSelectorComponent)).toBeTruthy();
      expect(spectator.query(MatProgressBar)).toBeFalsy();
      expect(spectator.query('.not-supported')).toBeFalsy();
    });
  });
});
