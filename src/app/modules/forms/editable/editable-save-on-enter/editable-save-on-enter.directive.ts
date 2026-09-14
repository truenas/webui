import { Directive, inject } from '@angular/core';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';

@Directive({
  selector: '[editableSaveOnEnter]',
  standalone: true,
  host: {
    '(keydown.enter)': 'onEnter($event)',
  },
})
export class EditableSaveOnEnterDirective {
  private editable = inject(EditableComponent);

  onEnter(event: Event): void {
    event.stopPropagation();

    this.editable.tryToClose();
  }
}
