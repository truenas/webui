import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { NgControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnSlideToggleHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { BaseOptionValueType, Option } from 'app/interfaces/option.interface';
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

  // Writes the stored value the way a form does on load: before the options arrive, so
  // they are ordered against it in `ngOnInit`. See the late-write case below for the
  // other order.
  function setUpWith(value: BaseOptionValueType[]): void {
    spectator = createComponent({
      props: { options: of(options) },
      detectChanges: false,
    });
    spectator.component.registerOnChange(onChange);
    spectator.component.registerOnTouched(onTouch);
    spectator.component.writeValue(value);
    spectator.detectChanges();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  beforeEach(() => {
    onChange.mockClear();
    onTouch.mockClear();

    setUpWith(['eth2']);
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

  // A saved value can name an option that is no longer offered — an interface claimed by
  // another LAG, renamed or removed. It must not disturb the options that do exist.
  it('skips a stored value that no longer has an option', async () => {
    setUpWith(['no-such-nic', 'eth1']);

    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.getLabelText()))).toEqual(['eth1', 'eth0', 'eth2']);
  });

  // A `patchValue` from a late-resolving request lands after the options have emitted,
  // so the rows have to be reordered by `writeValue` itself rather than by `ngOnInit`.
  // The order is rebuilt from the options as they arrived, so the previous value's
  // hoisting leaves nothing behind: `eth2` drops back below `eth0`.
  it('reorders the options when a value is written after they have arrived', async () => {
    spectator.component.writeValue(['eth1']);
    spectator.detectChanges();

    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.getLabelText()))).toEqual(['eth1', 'eth0', 'eth2']);
    expect(await Promise.all(toggles.map((toggle) => toggle.isChecked()))).toEqual([true, false, false]);
  });

  // The counterpart: clearing the value must not leave the rows hoisted by the value
  // that was there before.
  it('restores the original option order when the value is cleared', async () => {
    spectator.component.writeValue(null);
    spectator.detectChanges();

    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.getLabelText()))).toEqual(['eth0', 'eth1', 'eth2']);
    expect(await Promise.all(toggles.map((toggle) => toggle.isChecked()))).toEqual([false, false, false]);
  });

  // Dragging changes the base order the rows are rebuilt from, so a `writeValue` that
  // lands afterwards (a refresh after save, a validation-driven reset) must not snap the
  // rows back to the order the options arrived in.
  it('keeps a dragged order when a value is written afterwards', async () => {
    spectator.triggerEventHandler('[cdkDropList]', 'cdkDropListDropped', {
      previousIndex: 2,
      currentIndex: 1,
    } as CdkDragDrop<string[]>);
    spectator.component.writeValue(['eth2']);
    spectator.detectChanges();

    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.getLabelText()))).toEqual(['eth2', 'eth1', 'eth0']);
  });

  it('lists every option unchecked when the control has no value', async () => {
    setUpWith(null);

    const toggles = await loader.getAllHarnesses(TnSlideToggleHarness);

    expect(await Promise.all(toggles.map((toggle) => toggle.getLabelText()))).toEqual(['eth0', 'eth1', 'eth2']);
    expect(await Promise.all(toggles.map((toggle) => toggle.isChecked()))).toEqual([false, false, false]);
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
