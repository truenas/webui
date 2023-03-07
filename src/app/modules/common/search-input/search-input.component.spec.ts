import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatInputHarness } from '@angular/material/input/testing';
import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let spectator: SpectatorHost<SearchInputComponent>;
  let loader: HarnessLoader;
  let searchInput: MatInputHarness;
  const onSearch = jest.fn();
  const createHost = createHostFactory({
    component: SearchInputComponent,
    imports: [
      IxFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createHost('<ix-search-input (search)="onSearch($event)"></ix-search-input>', {
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
