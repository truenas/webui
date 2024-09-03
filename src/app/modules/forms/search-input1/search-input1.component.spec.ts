import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';

describe('SearchInputComponent', () => {
  let spectator: SpectatorHost<SearchInput1Component>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;
  const onSearch = jest.fn();
  const createHost = createHostFactory({
    component: SearchInput1Component,
    imports: [
    ],
  });

  beforeEach(async () => {
    spectator = createHost('<ix-search-input1 (search)="onSearch($event)"></ix-search-input1>', {
      hostProps: { onSearch },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    searchInput = await loader.getHarness(MatInputHarness);
  });

  it('shows reset button when input has value', async () => {
    let resetButton = spectator.query('.reset-input');
    expect(resetButton).toBeNull();

    await searchInput.setValue('test');

    resetButton = spectator.query('.reset-input');
    expect(resetButton).not.toBeNull();
  });

  it('resets input when reset button is pressed', async () => {
    await searchInput.setValue('test');
    spectator.click('.reset-input');

    expect(await searchInput.getValue()).toBe('');
    expect(onSearch).toHaveBeenCalledWith('');
  });

  it('emits (search) when user types in the input', async () => {
    await searchInput.setValue('test');

    expect(onSearch).toHaveBeenCalledWith('test');
  });
});
