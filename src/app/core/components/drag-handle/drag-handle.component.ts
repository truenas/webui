import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'ix-drag-handle',
  templateUrl: './drag-handle.component.html',
  styleUrls: ['./drag-handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragHandleComponent {
  @Input() showReorderHandle = false;
}
