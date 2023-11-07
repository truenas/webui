import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { SearchProperty } from 'app/modules/search-input/types/search-property.interface';

@Component({
  selector: 'ix-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdvancedSearchComponent {
  @Input() properties: SearchProperty<unknown>[] = [];

  @Output() switchToBasic = new EventEmitter<void>();

  @ViewChild('inputArea') inputArea: ElementRef<HTMLElement>;

  protected onResetInput(): void {
    this.inputArea.nativeElement.textContent = '';
  }
}
