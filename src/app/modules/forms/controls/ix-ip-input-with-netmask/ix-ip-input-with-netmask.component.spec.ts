import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Option } from 'app/interfaces/option.interface';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import {
  IxIpInputWithNetmaskHarness,
} from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.harness';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';
import { NetworkService } from 'app/services/network.service';

@Component({
  selector: 'ix-test-ip-input-host',
  template: '<ix-ip-input-with-netmask [formControl]="control" [testId]="testId()"></ix-ip-input-with-netmask>',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, IxIpInputWithNetmaskComponent],
})
class TestHostComponent {
  readonly control = new FormControl<string | null>(null);
  readonly testId = signal<(string | number)[] | undefined>(undefined);
}

describe('IxIpInputWithNetmaskComponent', () => {
  let spectator: Spectator<TestHostComponent>;
  let loader: HarnessLoader;
  let harness: IxIpInputWithNetmaskHarness;

  const createComponent = createComponentFactory({
    component: TestHostComponent,
    providers: [
      mockProvider(IxFormService),
      mockProvider(NetworkService, {
        getV4Netmasks: () => [{ label: '24', value: '24' }] as Option[],
        getV6PrefixLength: () => [{ label: '64', value: '64' }] as Option[],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    harness = await loader.getHarness(IxIpInputWithNetmaskHarness);
  });

  function renderedTestIds(): (string | null)[] {
    return spectator.queryAll('[data-test]').map((element) => element.getAttribute('data-test'));
  }

  it('keeps the netmask select on its fixed test id when none is passed', () => {
    expect(renderedTestIds()).toContain('select-netmasks');
  });

  it('names the address input and the netmask select after the test id it is given', () => {
    // A control in a form array is named by its index, so without this every array on a form
    // resolves its first address to the same `input-0`.
    spectator.component.testId.set(['network', 0]);
    spectator.detectChanges();

    expect(renderedTestIds()).toEqual(expect.arrayContaining(['input-network-0', 'select-network-0-netmask']));
    expect(renderedTestIds()).not.toContain('select-netmasks');
  });

  it('shows the address and netmask of the value the control starts with', async () => {
    spectator.component.control.setValue('10.1.2.3/24');
    spectator.detectChanges();

    expect(await harness.getValue()).toBe('10.1.2.3/24');
  });

  it('shows a value written to the control after the view has been rendered', async () => {
    // What a form loading its config from the API does: the patch lands long after the first
    // render, and this view is OnPush, so nothing but `writeValue` can mark it dirty.
    await harness.getValue();

    spectator.component.control.setValue('172.200.0.0/24');
    spectator.detectChanges();

    expect(await harness.getValue()).toBe('172.200.0.0/24');
  });

  it('offers IPv6 prefix lengths once the address written to the control is IPv6', async () => {
    spectator.component.control.setValue('fd42:4c58:43ae::/64');
    spectator.detectChanges();

    expect(await harness.getValue()).toBe('fd42:4c58:43ae::/64');
  });

  it('writes the address and netmask the user picks back to the control', async () => {
    await harness.setValue('192.168.1.0/24');

    expect(spectator.component.control.value).toBe('192.168.1.0/24');
  });
});
