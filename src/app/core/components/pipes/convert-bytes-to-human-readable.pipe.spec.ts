import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { ConvertBytesToHumanReadablePipe } from 'app/core/components/pipes/convert-bytes-to-human-readable.pipe';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';

describe('СonvertBytestoHumanReadablePipe', () => {
  let spectator: SpectatorPipe<ConvertBytesToHumanReadablePipe>;
  const createPipe = createPipeFactory({
    pipe: ConvertBytesToHumanReadablePipe,
    imports: [IxFormsModule],
    providers: [
      IxFormatterService,
    ],
  });

  it('converts number to human readable string', () => {
    spectator = createPipe('{{ inputValue | convertBytestoHumanReadable }}', {
      hostProps: {
        inputValue: 1632831778445,
      },
    });
    expect(spectator.element).toHaveExactText('1.49 TiB');
  });

  it('converts zero to human readable string', () => {
    spectator = createPipe('{{ inputValue | convertBytestoHumanReadable }}', {
      hostProps: {
        inputValue: 0,
      },
    });
    expect(spectator.element).toHaveExactText('0.00 B');
  });
});
