import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

@Component({
  selector: 'ix-search-input2',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  @Input() allowAdvanced = true;
  // TODO
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  @Input() properties: SearchProperty<any>[] = [];

  protected isInAdvancedMode = false;

  protected toggleAdvancedMode(): void {
    this.isInAdvancedMode = !this.isInAdvancedMode;
  }
}
