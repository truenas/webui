import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AdvancedSearchComponent } from 'app/modules/forms/search-input/components/advanced-search/advanced-search.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AdvancedSearchAutocompleteService } from 'app/modules/forms/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/forms/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/forms/search-input/services/query-to-api/query-to-api.service';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { SearchInputComponent } from './components/search-input/search-input.component';

@NgModule({
  imports: [
    IxIconModule,
    MatInputModule,
    TestIdModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatTooltipModule,
    AsyncPipe,
  ],
  exports: [
    SearchInputComponent,
  ],
  declarations: [
    SearchInputComponent,
    AdvancedSearchComponent,
    BasicSearchComponent,
  ],
  providers: [
    QueryParserService,
    QueryToApiService,
    AdvancedSearchAutocompleteService,
  ],
})
export class SearchInputModule {}
