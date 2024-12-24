import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  EnclosureHeaderComponent,
} from 'app/pages/system/enclosure/components/enclosure-header/enclosure-header.component';
import { ElementsPageComponent } from 'app/pages/system/enclosure/components/pages/elements-page/elements-page.component';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

describe('ElementsComponent', () => {
  let spectator: SpectatorRouting<ElementsPageComponent>;
  let loader: HarnessLoader;
  const createComponent = createRoutingFactory({
    component: ElementsPageComponent,
    params: {
      view: 'Voltage Sensor',
    },
    declarations: [
      MockComponent(EmptyComponent),
      MockComponent(EnclosureHeaderComponent),
    ],
    providers: [
      mockProvider(EnclosureStore, {
        enclosureLabel: () => 'M40',
        selectedEnclosure: () => ({
          elements: {
            [EnclosureElementType.VoltageSensor]: {
              45: {
                descriptor: '5V Sensor',
                status: 'OK',
                value: '5.06V',
              },
              46: {
                descriptor: '12V Sensor',
                status: 'OK',
                value: '12.01V',
              },
            },
          },
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders header with name of the current view', () => {
    const header = spectator.query(EnclosureHeaderComponent)!;
    expect(header.title).toBe('Voltage on M40');
  });

  it('renders enclosure elements for the view route parameter', async () => {
    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual([
      ['Descriptor', 'Status', 'Value'],
      ['5V Sensor', 'OK', '5.06V'],
      ['12V Sensor', 'OK', '12.01V'],
    ]);
  });

  it('renders an error when view from route param is not available for current enclosure', () => {
    spectator.setRouteParam('view', 'Cooling Fan');

    const empty = spectator.query(EmptyComponent)!;
    expect(empty).toExist();
    expect(empty.conf).toEqual({
      large: true,
      message: 'This view is not available for this enclosure.',
      title: 'N/A',
      type: EmptyType.Errors,
    });
  });
});
