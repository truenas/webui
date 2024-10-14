import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { QueryFilters } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { SearchInputComponent } from 'app/modules/forms/search-input/components/search-input/search-input.component';
import { SearchInputHarness } from 'app/modules/forms/search-input/components/search-input/search-input.harness';
import { AdvancedSearchAutocompleteService } from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';

describe('SearchInputComponent', () => {
  let spectator: Spectator<SearchInputComponent<User>>;
  let searchHarness: SearchInputHarness;
  const createComponent = createComponentFactory({
    component: SearchInputComponent<User>,
    imports: [
      FormsModule,
      BasicSearchComponent,
      AdvancedSearchComponent,
    ],
    providers: [
      QueryToApiService,
      QueryParserService,
      AdvancedSearchAutocompleteService,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    searchHarness = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, SearchInputHarness);
  });

  it('shows appropriate mode based on the query provided', async () => {
    spectator.setInput('query', {
      isBasicQuery: false,
      filters: [['username', '=', 'Bob']],
    });
    expect(await searchHarness.isInAdvancedMode()).toBe(true);

    spectator.setInput('query', {
      isBasicQuery: true,
      query: 'test',
    });

    expect(await searchHarness.isInAdvancedMode()).toBe(false);
  });

  it('switches to another mode when user presses Switch link', async () => {
    expect(await searchHarness.isInAdvancedMode()).toBe(false);
    await searchHarness.toggleMode();
    expect(await searchHarness.isInAdvancedMode()).toBe(true);
  });

  it('retains old values in each mode when user is switching between them', async () => {
    await searchHarness.setValue('basic');
    await searchHarness.toggleMode();
    expect(await searchHarness.getValue()).toBe('');

    await searchHarness.setValue('Username = "Bob"');

    await searchHarness.toggleMode();
    expect(await searchHarness.getValue()).toBe('basic');

    await searchHarness.toggleMode();
    expect(await searchHarness.getValue()).toBe('"Username" = "Bob"');
  });

  it('emits "queryChange" and "runSearch" when "BasicSearchComponent" emits events', () => {
    jest.spyOn(spectator.component.queryChange, 'emit').mockImplementation();
    jest.spyOn(spectator.component.runSearch, 'emit').mockImplementation();

    expect(spectator.queryAll(BasicSearchComponent)).toHaveLength(1);
    spectator.query(BasicSearchComponent).queryChange.emit('query string');
    spectator.query(BasicSearchComponent).runSearch.emit();

    expect(spectator.component.queryChange.emit).toHaveBeenCalledWith({
      isBasicQuery: true,
      query: 'query string',
    });

    expect(spectator.component.runSearch.emit).toHaveBeenCalledWith();
  });

  it('emits "queryChange" and "runSearch" when "AdvancedSearchComponent" emits events', () => {
    jest.spyOn(spectator.component.queryChange, 'emit').mockImplementation();
    jest.spyOn(spectator.component.runSearch, 'emit').mockImplementation();

    spectator.setInput('query', {
      isBasicQuery: false,
      filters: [],
    });

    const filters = [['username', '=', 'Bob']] as unknown as QueryFilters<unknown>;

    expect(spectator.queryAll(AdvancedSearchComponent)).toHaveLength(1);
    spectator.query(AdvancedSearchComponent).paramsChange.emit(filters);
    spectator.query(AdvancedSearchComponent).runSearch.emit();

    expect(spectator.component.queryChange.emit).toHaveBeenCalledWith({
      isBasicQuery: false,
      filters,
    });

    expect(spectator.component.runSearch.emit).toHaveBeenCalledWith();
  });
});
