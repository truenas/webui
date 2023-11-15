import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { SearchSuggestionsComponent } from 'app/modules/search-input/types/search-property.interface';

@Component({
  selector: 'ix-options-suggestions',
  templateUrl: './options-suggestions.component.html',
  styleUrls: ['./options-suggestions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionsSuggestionsComponent implements SearchSuggestionsComponent {
  @Input() options$: Observable<Option[]>;

  @Output() suggestionSelected = new EventEmitter<unknown>();
}
