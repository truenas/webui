import { FormControl } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator';
import {
  PropertiesOverrideValidatorService,
} from 'app/pages/data-protection/replication/replication-form/properties-override-validator/properties-override-validator.service';

describe('PropertiesOverrideValidatorService', () => {
  let spectator: SpectatorService<PropertiesOverrideValidatorService>;
  const createService = createServiceFactory(PropertiesOverrideValidatorService);

  beforeEach(() => spectator = createService());

  it('validates control and adds an error when value is not a correct set of property overrides', () => {
    const control = new FormControl(['foo=bar', 'foo=bar=bar']);
    const validationResult = spectator.service.validate(control);

    expect(validationResult).toEqual({
      customValidator: { message: 'Invalid format. Expected format: <property>=<value>' },
    });
  });

  it('validates control and does not add an error when value is a correct set of property overrides', () => {
    const control = new FormControl(['foo=bar', 'override=bar']);
    spectator.service.validate(control);

    const validationResult = spectator.service.validate(control);
    expect(validationResult).toBeNull();
  });
});
