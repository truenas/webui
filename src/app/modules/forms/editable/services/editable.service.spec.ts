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

  const addEventListener = jest.fn(
    (type: string, listener: EventListener) => {
      registeredListeners.set(type, listener);
    },
  );
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
    registeredListeners.clear();
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
    it('returns editables that contain a specific form control', () => {
      const component1 = {
        hasControl: (_: AbstractControl) => true,
      } as EditableComponent;
      const component2 = {
        hasControl: (_: AbstractControl) => false,
      } as EditableComponent;

      spectator.service.register(component1);
      spectator.service.register(component2);

      const result = spectator.service.findEditablesWithControl({} as AbstractControl);

      expect(result).toEqual([component1]);
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
    it('calls tryToClose on all editables except the ones passed in', () => {
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
      isOpen: () => true,
      tryToClose: jest.fn(),
      isElementWithin: () => false,
    } as unknown as EditableComponent;
    const component2 = {
      isOpen: () => true,
      tryToClose: jest.fn(),
      isElementWithin: () => true,
    } as unknown as EditableComponent;

    beforeEach(() => {
      spectator.service.register(component1);
      spectator.service.register(component2);
    });

    it('listens to keydown Escape and closes all if open editables exist', async () => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      const listener = registeredListeners.get('keydown');
      listener?.(event);

      await new Promise((resolve) => {
        requestAnimationFrame(resolve);
      });

      expect(component1.tryToClose).toHaveBeenCalled();
      expect(component2.tryToClose).toHaveBeenCalled();
    });

    it('listens to mousedown and closes only editables not clicked inside', fakeAsync(() => {
      const event = new MouseEvent('mousedown', { bubbles: true });
      Object.defineProperty(event, 'target', {
        value: document.createElement('div'),
      });

      const listener = registeredListeners.get('mousedown');
      listener?.(event);

      tick(0);

      expect(component1.tryToClose).toHaveBeenCalled();
      expect(component2.tryToClose).not.toHaveBeenCalled();
    }));
  });
});
