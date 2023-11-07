import { NgIf } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AdvancedSearchComponent } from 'app/modules/search-input/components/advanced-search/advanced-search.component';
import { BasicSearchComponent } from 'app/modules/search-input/components/basic-search/basic-search.component';
import { OptionsSuggestionsComponent } from 'app/modules/search-input/components/options-suggestions/options-suggestions.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { SearchInputComponent } from './components/search-input/search-input.component';

@NgModule({
  imports: [
    IxIconModule,
    MatInputModule,
    NgIf,
    TestIdModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  exports: [
    SearchInputComponent,
  ],
  declarations: [
    SearchInputComponent,
    AdvancedSearchComponent,
    OptionsSuggestionsComponent,
    BasicSearchComponent,
  ],
  providers: [],
})
export class SearchInputModule {
}
