import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'ix-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicSearchComponent {
  @Input() allowAdvanced = false;
  @Output() switchToAdvanced = new EventEmitter<void>();

  protected searchControl = new FormControl('');

  protected onResetInput(): void {
    this.searchControl.setValue('');
  }
}
