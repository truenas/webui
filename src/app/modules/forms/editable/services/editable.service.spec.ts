import { fakeAsync, tick } from '@angular/core/testing';
import { AbstractControl } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { EditableService } from 'app/modules/forms/editable/services/editable.service';

describe('EditableService', () => {
  let spectator: SpectatorService<EditableService>;

  type EventListener = (event: Event) => unknown;
  const registeredListeners = new Map<string, EventListener>();
  const addEventListener = jest.fn((type: string, listener: EventListener) => {
    registeredListeners.set(type, listener);
  });
  const removeEventListener = jest.fn();

  const createService = createServiceFactory({
    service: EditableService,
    providers: [
      mockWindow({
        document: {
          addEventListener: addEventListener as Document['addEventListener'],
          removeEventListener: removeEventListener as Document['removeEventListener'],
        } as Document,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('register', () => {
    it('adds a new EditableComponent to the list', () => {
      const component1 = {} as EditableComponent;
      const component2 = {} as EditableComponent;

      spectator.service.register(component1);
      spectator.service.register(component2);

      expect(spectator.service.getAll()).toEqual([component1, component2]);
    });

    it('only registers component once if register is called multiple times with the same arguments', () => {
      const component = {} as EditableComponent;

      spectator.service.register(component);
      spectator.service.register(component);

      expect(spectator.service.getAll()).toEqual([component]);
    });
  });

  describe('deregister', () => {
    it('removes the EditableComponent from the list', () => {
      const component = {} as EditableComponent;

      spectator.service.register(component);
      spectator.service.deregister(component);

      expect(spectator.service.getAll()).toEqual([]);
    });
  });

  describe('findEditablesWithControl', () => {
    it('returns an editable that contains specific form control', () => {
      const component1 = {
        hasControl: (_: AbstractControl) => true,
      } as EditableComponent;
      const component2 = {
        hasControl: (_: AbstractControl) => false,
      } as EditableComponent;

      spectator.service.register(component1);
      spectator.service.register(component2);

      const components = spectator.service.findEditablesWithControl({} as AbstractControl);

      expect(components).toEqual([component1]);
    });
  });

  describe('tryToCloseAll', () => {
    it('calls tryToClose on all registered editables', () => {
      const component1 = {
        tryToClose: jest.fn() as EditableComponent['tryToClose'],
      } as EditableComponent;
      const component2 = {
        tryToClose: jest.fn() as EditableComponent['tryToClose'],
      } as EditableComponent;

      spectator.service.register(component1);
      spectator.service.register(component2);

      spectator.service.tryToCloseAll();

      expect(component1.tryToClose).toHaveBeenCalled();
      expect(component2.tryToClose).toHaveBeenCalled();
    });
  });

  describe('tryToCloseAllExcept', () => {
    it('calls tryToClose on all registered editables except the ones passed in', () => {
      const component1 = {
        tryToClose: jest.fn() as EditableComponent['tryToClose'],
      } as EditableComponent;
      const component2 = {
        tryToClose: jest.fn() as EditableComponent['tryToClose'],
      } as EditableComponent;

      spectator.service.register(component1);
      spectator.service.register(component2);

      spectator.service.tryToCloseAllExcept([component1]);

      expect(component1.tryToClose).not.toHaveBeenCalled();
      expect(component2.tryToClose).toHaveBeenCalled();
    });
  });

  describe('document listeners', () => {
    const component1 = {
      tryToClose: jest.fn() as EditableComponent['tryToClose'],
      isElementWithin: jest.fn(() => false) as EditableComponent['isElementWithin'],
    } as EditableComponent;
    const component2 = {
      tryToClose: jest.fn() as EditableComponent['tryToClose'],
      isElementWithin: jest.fn(() => true) as EditableComponent['isElementWithin'],
    } as EditableComponent;

    beforeEach(() => {
      spectator.service.register(component1);
      spectator.service.register(component2);
    });

    it('listens to keydown events and tries to close all editables when Escape is pressed', () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const listener = registeredListeners.get('keydown');
      if (listener) {
        listener(event);
      }

      expect(component1.tryToClose).toHaveBeenCalled();
      expect(component2.tryToClose).toHaveBeenCalled();
    });

    it('listens to mousedown events and closes editables except the one that has received the click', fakeAsync(() => {
      const event = new MouseEvent('mousedown');
      const listener = registeredListeners.get('mousedown');
      if (listener) {
        listener(event);
      }

      tick(100);

      expect(component1.tryToClose).toHaveBeenCalled();
      expect(component2.tryToClose).not.toHaveBeenCalled();
    }));
  });
});
