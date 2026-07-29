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

  it('resets the field when the clear action is pressed', async () => {
    spectator.setInput('query', 'test');
    await searchHarness.clearInput();

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

      expect(await (await searchHarness.getSwitchLink())!.text()).toBe('Advanced');
      await searchHarness.clickSwitchToAdvanced();

      expect(spectator.component.switchToAdvanced.emit).toHaveBeenCalled();
    });
  });

  describe('accessibility', () => {
    it('exposes an accessible clear action when the field has a value', () => {
      spectator.setInput('query', 'test');

      const clearButton = spectator.query('[data-test="button-clear-search"]');
      expect(clearButton).toExist();
      expect(clearButton.tagName.toLowerCase()).toBe('button');
      expect(clearButton.getAttribute('aria-label')).toBe('Clear search');
    });

    it('hides the clear action when the field is empty', () => {
      const clearButton = spectator.query('[data-test="button-clear-search"]');
      expect(clearButton).not.toExist();
    });
  });
});
