import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';

@Component({
  selector: 'ix-drag-handle',
  templateUrl: './drag-handle.component.html',
  styleUrls: ['./drag-handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DragHandleComponent {
  readonly showReorderHandle = input(false);
}
