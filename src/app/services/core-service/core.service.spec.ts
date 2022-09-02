import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { CoreEvent } from 'app/interfaces/events';
import { CoreService, Registration } from 'app/services/core-service/core.service';

interface MockObject {
  name: string;
}

describe('CoreService', () => {
  let spectator: SpectatorService<CoreService>;

  const createService = createServiceFactory({
    service: CoreService,
  });

  /*
   * Test Methods
   * */

  beforeEach(() => {
    spectator = createService();
  });

  /*
   * Registrations
   * */

  it('should register an observer to dispatch table', () => {
    const mockObserver: MockObject = { name: 'Observer1' };
    const payload: Registration = { observerClass: mockObserver };
    spectator.service.register(payload);

    const dispatchTable = spectator.service.registrations;

    expect(dispatchTable.length).toBe(1);
    expect(dispatchTable[0]).toMatchObject(payload);
  });

  it('should remove a registration from dispatch table', () => {
    const mockObserver1: MockObject = { name: 'Observer1' };
    const mockObserver2: MockObject = { name: 'Observer2' };

    const payload1: Registration = { observerClass: mockObserver1, eventName: 'TestEvent1' };
    spectator.service.register(payload1);

    const payload2: Registration = { observerClass: mockObserver2, eventName: 'TestEvent2' };
    spectator.service.register(payload2);

    expect(spectator.service.registrations.length).toBe(2);

    spectator.service.unregister(payload1);
    const dispatchTable = spectator.service.registrations;

    expect(dispatchTable.length).toEqual(1);
    expect(dispatchTable[0].eventName).toMatch('TestEvent2');
    expect(dispatchTable[0].observerClass).toHaveProperty('name', 'Observer2');
  });

  it('should remove all of an observers registrations from dispatch table', () => {
    const mockObserver1: MockObject = { name: 'Observer1' };
    const mockObserver2: MockObject = { name: 'Observer2' };
    const payload1: Registration = { observerClass: mockObserver1, eventName: 'TestEvent', sender: mockObserver1 };
    spectator.service.register(payload1);

    for (let i = 0; i < 3; i++) {
      const payload: Registration = { observerClass: mockObserver2, eventName: `TestEvent${i}`, sender: {} };
      spectator.service.register(payload);
    }

    spectator.service.unregister({ observerClass: mockObserver2 });

    const dispatchTable = spectator.service.registrations;

    expect(dispatchTable.length).toBe(1);
    expect(spectator.service.registrations[0]).toMatchObject(payload1);
  });

  /*
   * Dispatching Notifications
   * */

  it('should handle registrations with specific event name and specific sender', () => {
    const mockObserver: MockObject = { name: 'Observer' };
    const mockSender1: MockObject = { name: 'Sender1' };
    const mockSender2: MockObject = { name: 'Sender2' };

    // Create registrations
    const reg: Registration = { observerClass: mockObserver, eventName: 'TestEvent', sender: mockSender2 };
    spectator.service.register(reg)
      .subscribe((evt: CoreEvent) => {
        expect(evt.sender).toMatchObject(mockSender2);
        expect(evt.sender).toMatch('Sender2');
        expect(evt.name).toMatch('TestEvent');
        spectator.service.unregister({ observerClass: mockSender2 });
      });

    // Only the TestEvent from mockSender2 should be received
    spectator.service.emit({ name: 'TestEvent', sender: mockSender1 });
    spectator.service.emit({ name: 'OtherEvent', sender: mockSender2 });
    spectator.service.emit({ name: 'TestEvent', sender: mockSender2 });
  });

  it('should handle registrations with event name and sender wild card', () => {
    const mockObserver: MockObject = { name: 'Observer' };
    const mockSender1: MockObject = { name: 'Sender1' };
    const mockSender2: MockObject = { name: 'Sender2' };

    let totalEvents = 0;

    // Create registrations
    const reg: Registration = { observerClass: mockObserver, eventName: 'TestEvent' };
    spectator.service.register(reg)
      .subscribe((evt: CoreEvent) => {
        totalEvents++;
        expect(evt.name).toMatch('TestEvent');

        if (totalEvents === 2) {
          spectator.service.unregister({ observerClass: mockObserver });
          expect(totalEvents).toEqual(4);
        }
      });

    // All TestEvents should be received regardless of sender
    spectator.service.emit({ name: 'OtherEvent', sender: mockSender1 });
    spectator.service.emit({ name: 'TestEvent', sender: mockSender1 });
    spectator.service.emit({ name: 'TestEvent', sender: mockSender2 });
  });

  it('should handle registrations with event name wild card and sender', () => {
    const mockObserver: MockObject = { name: 'Observer' };
    const mockSender1: MockObject = { name: 'Sender1' };
    const mockSender2: MockObject = { name: 'Sender2' };

    let totalEvents = 0;

    // Create registrations
    const reg: Registration = { observerClass: mockObserver, sender: mockSender2 };
    spectator.service.register(reg)
      .subscribe((evt: CoreEvent) => {
        totalEvents++;
        expect(evt.sender).toMatchObject(mockSender2);
        expect((evt.sender as MockObject).name).toMatch('Sender2');

        if (totalEvents === 2) spectator.service.unregister({ observerClass: mockObserver });
      });

    // Only the events from mockSender2 should be received
    spectator.service.emit({ name: 'TestEvent', sender: mockSender1 });
    spectator.service.emit({ name: 'TestEvent', sender: mockSender2 });
    spectator.service.emit({ name: 'OtherEvent', sender: mockSender2 });
  });

  it('should handle registrations with event name wild card and sender wild card', () => {
    const mockObserver: MockObject = { name: 'Observer' };
    const mockSender1: MockObject = { name: 'Sender1' };
    const mockSender2: MockObject = { name: 'Sender2' };

    let totalEvents = 0;

    // Create registrations
    const reg: Registration = { observerClass: mockObserver };
    spectator.service.register(reg)
      .subscribe(() => {
        totalEvents++;
        if (totalEvents === 3) {
          spectator.service.unregister({ observerClass: mockObserver });
          expect(totalEvents).toEqual(3);
        }
      });

    // All of these events should be received
    spectator.service.emit({ name: 'TestEvent', sender: mockSender1 });
    spectator.service.emit({ name: 'TestEvent', sender: mockSender2 });
    spectator.service.emit({ name: 'OtherEvent', sender: mockSender2 });
  });
});
