import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { TnSlideToggleHarness } from '@truenas/ui-components';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { TableToggleCellComponent } from 'app/modules/tn-table-cells/toggle-cell/table-toggle-cell.component';

describe('TableToggleCellComponent', () => {
  let spectator: Spectator<TableToggleCellComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: TableToggleCellComponent,
    providers: [mockAuth()],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        title: 'Enabled',
        uniqueRowTag: 'card-smb-share-smb123',
        ariaLabel: 'smb123 SMB Share',
        checked: true,
        disabled: false,
        tooltip: '',
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('renders a checked toggle with the composed test id', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness);
    expect(await toggle.isChecked()).toBe(true);
    expect(await toggle.getTestId()).toBe('toggle-enabled-card-smb-share-smb123-row-toggle');
  });

  it('reflects the disabled input', async () => {
    spectator.setInput('disabled', true);
    const toggle = await loader.getHarness(TnSlideToggleHarness);
    expect(await toggle.isDisabled()).toBe(true);
  });

  it('emits toggled when the switch is changed', async () => {
    const emitted = jest.fn();
    spectator.component.toggled.subscribe(emitted);

    const toggle = await loader.getHarness(TnSlideToggleHarness);
    await toggle.uncheck();

    expect(emitted).toHaveBeenCalledWith(false);
  });
});
