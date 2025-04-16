import { Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';

@Injectable({
  providedIn: 'root',
})
export class EditableService {
  private editables = new Set<EditableComponent>();

  getAll(): EditableComponent[] {
    return Array.from(this.editables);
  }

  register(component: EditableComponent): void {
    this.editables.add(component);
  }

  deregister(component: EditableComponent): void {
    this.editables.delete(component);
  }

  closeAll(): void {
    this.editables.forEach((editable) => editable.tryToClose());
  }

  findEditablesWithControl(control: AbstractControl): EditableComponent[] {
    return Array.from(this.editables).filter((editable) => {
      return editable.hasControl(control);
    });
  }
}
