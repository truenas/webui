import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { User } from 'app/interfaces/user.interface';
import { AdvancedSearchComponent } from 'app/modules/search-input/components/advanced-search/advanced-search.component';
import { AdvancedSearchHarness } from 'app/modules/search-input/components/advanced-search/advanced-search.harness';
import { SearchQueryService } from 'app/modules/search-input/services/search-query.service';

describe('AdvancedSearchComponent', () => {
  let spectator: Spectator<AdvancedSearchComponent<User>>;
  let searchHarness: AdvancedSearchHarness;
  const createComponent = createComponentFactory({
    component: AdvancedSearchComponent,
    providers: [
      SearchQueryService,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    jest.spyOn(spectator.component.switchToBasic, 'emit');
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, AdvancedSearchHarness);
  });

  // TODO: Test case for emit

  it('resets text area when reset icon is pressed', async () => {
    await searchHarness.setValue('test');
    await (await searchHarness.getResetIcon()).click();

    expect(await searchHarness.getValue()).toBe('');
  });

  it('emits (switchToBasic) when Switch To Basic is pressed', async () => {
    expect(await (await searchHarness.getSwitchLink()).text()).toBe('Switch To Basic');
    await searchHarness.clickSwitchToBasic();

    expect(spectator.component.switchToBasic.emit).toHaveBeenCalled();
  });
});
