import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { TnEmptyHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
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
            // A second populated view, to prove a real route change keeps the sort.
            [EnclosureElementType.PowerSupply]: {
              1: {
                descriptor: 'PSU B',
                status: 'OK',
                value: '750W',
              },
              2: {
                descriptor: 'PSU A',
                status: 'OK',
                value: '750W',
              },
            },
            // Present but with no elements — drives the empty-table state.
            [EnclosureElementType.Cooling]: {},
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
    const table = await loader.getHarness(TnTableHarness);

    expect(await table.getHeaderTexts()).toEqual(['Descriptor', 'Status', 'Value']);
    expect(await table.getAllRowTexts()).toEqual([
      ['5V Sensor', 'OK', '5.06V'],
      ['12V Sensor', 'OK', '12.01V'],
    ]);
  });

  it('keeps the legacy table-table test id', async () => {
    // `tn-table` is one of the untyped components — it writes `testId` verbatim, so the full
    // legacy value has to be passed. Guards against it being dropped entirely.
    await spectator.fixture.whenStable();

    expect(spectator.query('tn-table')).toHaveAttribute('data-test', 'table-table');
  });

  it('keeps sorting applied when the route view changes', async () => {
    const table = await loader.getHarness(TnTableHarness);
    await table.clickSortHeader('descriptor');
    spectator.detectChanges();

    expect(await table.getSortDirection('descriptor')).toBe('ascending');
    expect((await table.getAllRowTexts()).map((row) => row[0])).toEqual(['12V Sensor', '5V Sensor']);

    // Switch to a DIFFERENT populated view. The table instance survives the route change, so
    // its header keeps the arrow — the refilled rows have to keep matching it.
    spectator.setRouteParam('view', EnclosureElementType.PowerSupply);
    spectator.detectChanges();

    expect(await table.getSortDirection('descriptor')).toBe('ascending');
    expect((await table.getAllRowTexts()).map((row) => row[0])).toEqual(['PSU A', 'PSU B']);
  });

  it('shows a no-records empty state when the view has no elements', async () => {
    // `ArrayDataProvider.emptyType$` starts as `Loading`, so without an explicit
    // `setEmptyType` the empty table renders "Loading..." forever.
    spectator.setRouteParam('view', 'Cooling');
    spectator.detectChanges();

    const table = await loader.getHarness(TnTableHarness);
    expect(await table.getRowCount()).toBe(0);
    expect(spectator.query('tn-table')).toHaveText('No records have been added yet');
  });

  it('renders an error when view from route param is not available for current enclosure', async () => {
    spectator.setRouteParam('view', 'Cooling Fan');

    const empty = await loader.getHarness(TnEmptyHarness);
    expect(await empty.getTitle()).toBe('N/A');
    expect(await empty.getDescription()).toBe('This view is not available for this enclosure.');
  });
});
