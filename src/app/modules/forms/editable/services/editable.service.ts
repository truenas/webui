import { Injectable, OnDestroy, inject } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { WINDOW } from 'app/helpers/window.helper';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';

@Injectable({
  providedIn: 'root',
})
export class EditableService implements OnDestroy {
  private window = inject<Window>(WINDOW);

  private editables = new Set<EditableComponent>();
  private listenersInitialized = false;

  get hasOpenEditables(): boolean {
    return this.getAll().some((item) => item.isOpen());
  }

  private keydownHandler = this.handleKeydown.bind(this);

  ngOnDestroy(): void {
    this.removeDocumentListeners();
  }

  getAll(): EditableComponent[] {
    return Array.from(this.editables);
  }

  register(component: EditableComponent): void {
    this.editables.add(component);

    if (!this.listenersInitialized) {
      this.setupDocumentListeners();
      this.listenersInitialized = true;
    }
  }

  deregister(component: EditableComponent): void {
    this.editables.delete(component);

    if (this.editables.size === 0) {
      this.removeDocumentListeners();
      this.listenersInitialized = false;
    }
  }

  tryToCloseAll(): void {
    this.tryToCloseAllExcept([]);
  }

  tryToCloseAllExcept(except: EditableComponent[]): void {
    this.editables.forEach((editable) => {
      if (!except.includes(editable)) {
        editable.tryToClose();
      }
    });
  }

  findEditablesWithControl(control: AbstractControl): EditableComponent[] {
    return this.getAll().filter((editable) => editable.hasControl(control));
  }

  private setupDocumentListeners(): void {
    this.window.document.addEventListener('keydown', this.keydownHandler, true);
  }

  private removeDocumentListeners(): void {
    this.window.document.removeEventListener('keydown', this.keydownHandler, true);
  }

  private handleKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.hasOpenEditables) return;

    // Defer the decision to end of event loop
    requestAnimationFrame(() => {
      if (!event.defaultPrevented) {
        this.tryToCloseAll();
      }
    });
  }
}
