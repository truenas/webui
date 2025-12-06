import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { ValidationErrorCommunicationService, ValidationErrorEvent } from './validation-error-communication.service';

describe('ValidationErrorCommunicationService', () => {
  let spectator: SpectatorService<ValidationErrorCommunicationService>;
  const createService = createServiceFactory(ValidationErrorCommunicationService);

  beforeEach(() => {
    spectator = createService();
  });

  it('should be created', () => {
    expect(spectator.service).toBeTruthy();
  });

  it('should emit validation error events when notifyValidationError is called', () => {
    const mockCallback = jest.fn();

    spectator.service.validationErrors$.subscribe(mockCallback);

    spectator.service.notifyValidationError('testField');

    expect(mockCallback).toHaveBeenCalledWith({ fieldName: 'testField' });
  });

  it('should emit multiple validation error events', () => {
    const receivedEvents: ValidationErrorEvent[] = [];

    spectator.service.validationErrors$.subscribe((event) => {
      receivedEvents.push(event);
    });

    spectator.service.notifyValidationError('field1');
    spectator.service.notifyValidationError('field2');
    spectator.service.notifyValidationError('field3');

    expect(receivedEvents).toEqual([
      { fieldName: 'field1' },
      { fieldName: 'field2' },
      { fieldName: 'field3' },
    ]);
  });

  it('should handle empty field names', () => {
    const mockCallback = jest.fn();

    spectator.service.validationErrors$.subscribe(mockCallback);

    spectator.service.notifyValidationError('');

    expect(mockCallback).toHaveBeenCalledWith({ fieldName: '' });
  });

  it('should allow multiple subscribers', () => {
    const mockCallback1 = jest.fn();
    const mockCallback2 = jest.fn();

    spectator.service.validationErrors$.subscribe(mockCallback1);
    spectator.service.validationErrors$.subscribe(mockCallback2);

    spectator.service.notifyValidationError('sharedField');

    expect(mockCallback1).toHaveBeenCalledWith({ fieldName: 'sharedField' });
    expect(mockCallback2).toHaveBeenCalledWith({ fieldName: 'sharedField' });
  });
});
