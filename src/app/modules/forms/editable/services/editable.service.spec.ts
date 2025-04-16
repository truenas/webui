import { AbstractControl } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import { EditableService } from 'app/modules/forms/editable/services/editable.service';

describe('EditableService', () => {
  let service: SpectatorService<EditableService>;
  const createService = createServiceFactory({
    service: EditableService,
  });

  beforeEach(() => {
    service = createService();
  });

  describe('register', () => {
    it('adds a new EditableComponent to the list', () => {
      const component1 = {} as EditableComponent;
      const component2 = {} as EditableComponent;

      service.service.register(component1);
      service.service.register(component2);

      expect(service.service.getAll()).toEqual([component1, component2]);
    });

    it('only registers component once if register is called multiple times with the same arguments', () => {
      const component = {} as EditableComponent;

      service.service.register(component);
      service.service.register(component);

      expect(service.service.getAll()).toEqual([component]);
    });
  });

  describe('deregister', () => {
    it('removes the EditableComponent from the list', () => {
      const component = {} as EditableComponent;

      service.service.register(component);
      service.service.deregister(component);

      expect(service.service.getAll()).toEqual([]);
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

      service.service.register(component1);
      service.service.register(component2);

      const components = service.service.findEditablesWithControl({} as AbstractControl);

      expect(components).toEqual([component1]);
    });
  });
});
