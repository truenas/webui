import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'ix-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BasicSearchComponent {
  @Input() query: string;
  @Input() allowAdvanced = false;
  @Output() switchToAdvanced = new EventEmitter<void>();
  @Output() queryChange = new EventEmitter<string>();

  protected resetInput(): void {
    this.query = '';
    this.queryChange.emit(this.query);
  }
}
