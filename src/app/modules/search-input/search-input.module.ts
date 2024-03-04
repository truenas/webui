import { CommonModule, NgIf } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AdvancedSearchComponent } from 'app/modules/search-input/components/advanced-search/advanced-search.component';
import { BasicSearchComponent } from 'app/modules/search-input/components/basic-search/basic-search.component';
import { AdvancedSearchAutocompleteService } from 'app/modules/search-input/services/advanced-search-autocomplete.service';
import { QueryParserService } from 'app/modules/search-input/services/query-parser/query-parser.service';
import { QueryToApiService } from 'app/modules/search-input/services/query-to-api/query-to-api.service';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { SearchInputComponent } from './components/search-input/search-input.component';

@NgModule({
  imports: [
    CommonModule,
    IxIconModule,
    MatInputModule,
    NgIf,
    TestIdModule,
    TranslateModule,
    ReactiveFormsModule,
    FormsModule,
    CastModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatCardModule,
    MatTooltipModule,
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
