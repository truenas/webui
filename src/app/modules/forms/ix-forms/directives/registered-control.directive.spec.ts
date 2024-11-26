import { ElementRef } from '@angular/core';
import { NgControl } from '@angular/forms';
import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator/jest';
import { RegisteredControlDirective } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { IxFormService } from 'app/modules/forms/ix-forms/services/ix-form.service';

describe('RegisteredControlDirective', () => {
  let spectator: SpectatorDirective<RegisteredControlDirective>;

  const createDirective = createDirectiveFactory({
    directive: RegisteredControlDirective,
    providers: [
      mockProvider(IxFormService),
      mockProvider(NgControl),
    ],
  });

  beforeEach(() => {
    spectator = createDirective('<div ixRegisteredControl></div>');
  });

  it('registers control and element ref of the element with form service', () => {
    expect(spectator.inject(IxFormService).registerControl).toHaveBeenCalledWith(
      spectator.inject(NgControl),
      expect.any(ElementRef),
    );
  });
});
