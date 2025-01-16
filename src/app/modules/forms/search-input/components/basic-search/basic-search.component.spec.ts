import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { BasicSearchHarness } from 'app/modules/forms/search-input/components/basic-search/basic-search.harness';

describe('BasicSearchComponent', () => {
  let spectator: Spectator<BasicSearchComponent>;
  let searchHarness: BasicSearchHarness;
  const createComponent = createComponentFactory({
    component: BasicSearchComponent,
    imports: [
      FormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    jest.spyOn(spectator.component.queryChange, 'emit');
    jest.spyOn(spectator.component.switchToAdvanced, 'emit');
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, BasicSearchHarness);
  });

  it('emits (queryChange) when user types in the field', async () => {
    await searchHarness.setValue('test');

    expect(spectator.component.queryChange.emit).toHaveBeenCalledWith('test');
  });

  it('resets text area when reset icon is pressed', async () => {
    await searchHarness.setValue('test');
    await (await searchHarness.getResetIcon()).click();

    expect(await searchHarness.getValue()).toBe('');
    expect(spectator.component.queryChange.emit).toHaveBeenCalledWith('');
  });

  describe('allowAdvanced', () => {
    it('shows a link to Switch To Advanced when [allowAdvanced] is true', async () => {
      expect(await searchHarness.getSwitchLink()).toBeNull();

      spectator.setInput('allowAdvanced', true);

      expect(await searchHarness.getSwitchLink()).not.toBeNull();
    });

    it('emits (switchToAdvanced) when Switch To Advanced is pressed', async () => {
      spectator.setInput('allowAdvanced', true);

      expect(await (await searchHarness.getSwitchLink())!.text()).toBe('Switch To Advanced');
      await searchHarness.clickSwitchToAdvanced();

      expect(spectator.component.switchToAdvanced.emit).toHaveBeenCalled();
    });
  });
});
