import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { AuditEvent, AuditService } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { GetLogImportantDataPipe } from 'app/pages/audit/utils/get-log-important-data.pipe';

describe('GetLogImportantDataPipe', () => {
  let spectator: SpectatorPipe<GetLogImportantDataPipe>;
  const createPipe = createPipeFactory({
    pipe: GetLogImportantDataPipe,
  });

  it('transforms middleware method call entry to description', () => {
    const entry = {
      service: AuditService.Middleware,
      event: AuditEvent.MethodCall,
      event_data: { method: 'test.method', description: 'Test description' },
    } as AuditEntry;

    spectator = createPipe('{{ entry | getLogImportantData }}', { hostProps: { entry } });

    expect(spectator.element.innerHTML).toBe('Test description');
  });
});
