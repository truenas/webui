import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { utcToZonedTime } from 'date-fns-tz';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';

describe('FormatDateTimePipe', () => {
  let spectator: SpectatorPipe<FormatDateTimePipe>;
  const inputValue = utcToZonedTime(1709643804732, 'Europe/London').getTime();
  const createPipe = createPipeFactory({
    pipe: FormatDateTimePipe,
  });

  it('converts timestamp to date', () => {
    spectator = createPipe('{{ inputValue | formatDateTime }}', {
      hostProps: {
        inputValue,
      },
    });
    expect(spectator.element).toHaveExactText('2024-03-05 13:03:24');
  });

  it('converts date using custom date format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"dd/MM/yyyy" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
    });
    expect(spectator.element).toHaveExactText('05/03/2024 13:03:24');
  });

  it('converts date using custom time format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"":"HH:mm" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
    });
    expect(spectator.element).toHaveExactText('2024-03-05 13:03');
  });

  it('converts date using custom time format with old style " A" format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"":"hh:mm A" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
    });
    expect(spectator.element).toHaveExactText('2024-03-05 01:03 PM');
  });

  it('converts date string using user time format', () => {
    spectator = createPipe('{{ inputValue | formatDateTime }}', {
      hostProps: {
        inputValue: 'Tue Jun 20 06:55:04 2023',
      },
    });
    expect(spectator.element).toHaveExactText('2023-06-20 06:55:04');
  });
});
