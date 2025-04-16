import { Directive, HostListener } from '@angular/core';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';

@Directive({
  selector: '[editableSaveOnEnter]',
  standalone: true,
})
export class EditableOnEnterDirective {
  constructor(
    private editable: EditableComponent,
  ) {}

  @HostListener('keydown.enter', ['$event'])
  onEnter(event: KeyboardEvent): void {
    event.stopPropagation();

    this.editable.tryToClose();
  }
}
