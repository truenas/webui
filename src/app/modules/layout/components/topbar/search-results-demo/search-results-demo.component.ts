import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-search-results-demo',
  templateUrl: './search-results-demo.component.html',
  styleUrls: ['./search-results-demo.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchResultsDemoComponent {
  hasSections = false;
}
