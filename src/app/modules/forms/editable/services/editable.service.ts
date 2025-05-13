import { Inject, Injectable } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { debounceTime, fromEvent, takeWhile } from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';

@Injectable({
  providedIn: 'root',
})
export class EditableService {
  private editables = new Set<EditableComponent>();

  constructor(
    @Inject(WINDOW) private window: Window,
  ) {
    this.setupDocumentListeners();
  }

  getAll(): EditableComponent[] {
    return Array.from(this.editables);
  }

  register(component: EditableComponent): void {
    this.editables.add(component);
  }

  deregister(component: EditableComponent): void {
    this.editables.delete(component);
  }

  tryToCloseAll(): void {
    this.tryToCloseAllExcept([]);
  }

  tryToCloseAllExcept(except: EditableComponent[]): void {
    this.editables.forEach((editable) => {
      if (except.includes(editable)) {
        return;
      }

      editable.tryToClose();
    });
  }

  findEditablesWithControl(control: AbstractControl): EditableComponent[] {
    return Array.from(this.editables).filter((editable) => {
      return editable.hasControl(control);
    });
  }

  private setupDocumentListeners(): void {
    fromEvent(this.window.document, 'keydown')
      .pipe(
        debounceTime(0),
        takeWhile((_) => this.editables.size > 0),
      )
      .subscribe((event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          this.tryToCloseAll();
        }
      });

    fromEvent(this.window.document, 'mousedown')
      .pipe(
        debounceTime(0),
        takeWhile((_) => this.editables.size > 0),
      )
      .subscribe((event: MouseEvent) => {
        const target = event.target as HTMLElement;
        const clickedWithin = Array.from(this.editables)
          .filter((editable) => editable.isElementWithin(target));

        this.tryToCloseAllExcept(clickedWithin);
      });
  }
}
