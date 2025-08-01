import { Directive, HostListener, inject } from '@angular/core';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';

@Directive({
  selector: '[editableSaveOnEnter]',
  standalone: true,
})
export class EditableSaveOnEnterDirective {
  private editable = inject(EditableComponent);


  @HostListener('keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    event.stopPropagation();

    this.editable.tryToClose();
  }
}
