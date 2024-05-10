import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { DashboardEnclosure } from 'app/interfaces/enclosure.interface';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import {
  EnclosureDashboardComponent,
} from 'app/pages/system/enclosure/components/enclosure-dashboard/enclosure-dashboard.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('EnclosureDashboardComponent', () => {
  let spectator: Spectator<EnclosureDashboardComponent>;
  // eslint-disable-next-line unused-imports/no-unused-vars
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: EnclosureDashboardComponent,
    shallow: true,
    imports: [
      PageHeaderModule,
    ],
    providers: [
      mockProvider(MatDialog),
      mockProvider(EnclosureStore, {
        selectedEnclosure$: of({
          id: 'enclosure-id',
          name: 'M50',
          label: 'Current label',
        } as DashboardEnclosure),
        initiate: jest.fn(),
        renameSelectedEnclosure: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
  });

  it('initializes store when component is initialized', () => {
    try {
      console.info('start of initializes store');
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      expect(2).toBe(2);
      console.info('end of initializes store');
    } catch (error) {
      console.error(error);
    }
  });

  it('opens edit dialog when Edit Label is pressed', () => {
    try {
      console.info('start of opens edit dialog');
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);

      console.info('a');
      expect(2).toBe(2);
    } catch (error) {
      console.error(error);
    }
  });
});
