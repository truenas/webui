import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnSlideToggleHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { OrderedListboxComponent } from 'app/modules/lists/ordered-list/ordered-list.component';

describe('OrderedListboxComponent', () => {
  let spectator: Spectator<OrderedListboxComponent>;
  let loader: HarnessLoader;

  const onChange = jest.fn();
  const onTouch = jest.fn();
  const options: Option[] = [
    { label: 'eth0', value: 'eth0' },
    { label: 'eth1', value: 'eth1' },
    { label: 'eth2', value: 'eth2' },
  ];

  const createComponent = createComponentFactory({
    component: OrderedListboxComponent,
    declarations: [
      MockComponent(IxLabelComponent),
      MockComponent(IxErrorsComponent),
    ],
    providers: [
      { provide: NgControl, useValue: { name: 'lag_ports' } },
    ],
  });

  beforeEach(() => {
    onChange.mockClear();
    onTouch.mockClear();

    spectator = createComponent({
      props: { options: of(options) },
      detectChanges: false,
    });
    spectator.component.registerOnChange(onChange);
    spectator.component.registerOnTouched(onTouch);
    spectator.component.writeValue(['eth2']);
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('lists every option, with the selected ones hoisted to the top', async () => {
    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.getLabelText()))).toEqual(['eth2', 'eth0', 'eth1']);
  });

  // `[ixTest]` on the old `<mat-slide-toggle>` resolved to `toggle-<control>-<option>`,
  // kebab-cased with a letter→digit split the library does not do on its own. The
  // `toggle` prefix is the library's now, so pin the whole resolved value.
  it('keeps the legacy test ids on the toggles', async () => {
    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.getTestId())))
      .toEqual(['toggle-lag-ports-eth-2', 'toggle-lag-ports-eth-0', 'toggle-lag-ports-eth-1']);
  });

  it('checks the toggles of the selected options', async () => {
    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.isChecked()))).toEqual([true, false, false]);
  });

  it('reports the value in list order when an option is toggled on', async () => {
    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);
    await toggles[1].toggle();

    expect(onChange).toHaveBeenCalledWith(['eth2', 'eth0']);
  });

  it('reports the value without an option that was toggled off', async () => {
    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);
    await toggles[0].toggle();

    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('marks the control as touched when a toggle loses focus', () => {
    spectator.dispatchFakeEvent(spectator.query('tn-slide-toggle'), 'focusout', true);

    expect(onTouch).toHaveBeenCalled();
  });

  it('disables every toggle when the control is disabled', async () => {
    spectator.component.setDisabledState(true);
    spectator.detectChanges();

    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.isDisabled()))).toEqual([true, true, true]);
  });
});
