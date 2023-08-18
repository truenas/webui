import { createPipeFactory, mockProvider, SpectatorPipe } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';

describe('FormatDateTimePipe', () => {
  let spectator: SpectatorPipe<FormatDateTimePipe>;
  const inputValue = 1632831778445;
  const createPipe = createPipeFactory({
    pipe: FormatDateTimePipe,
    providers: [
      mockProvider(Store, {
        select: () => of(),
      }),
    ],
  });

  it('converts timestamp to date', () => {
    spectator = createPipe('{{ inputValue | formatDateTime:"America/Los_Angeles" }}', {
      hostProps: {
        inputValue,
      },
    });
    expect(spectator.element).toHaveExactText('2021-09-28 05:22:58');
  });

  it('converts timestamp using timezone from pipe args', () => {
    spectator = createPipe('{{ inputValue | formatDateTime:"America/Los_Angeles" }}', {
      hostProps: {
        inputValue,
      },
    });
    expect(spectator.element).toHaveExactText('2021-09-28 05:22:58');
  });

  it('converts timestamp to UTC timezone', () => {
    spectator = createPipe('{{ inputValue | formatDateTime }}', {
      hostProps: {
        inputValue,
      },
      providers: [
        mockProvider(Store, {
          select: () => of('UTC'),
        }),
      ],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 12:22:58');
  });

  it('converts timestamp to Europe/Kiev timezone', () => {
    spectator = createPipe('{{ inputValue | formatDateTime }}', {
      hostProps: {
        inputValue,
      },
      providers: [
        mockProvider(Store, {
          select: () => of('Europe/Kiev'),
        }),
      ],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 15:22:58');
  });

  it('converts date to Europe/Kiev timezone', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"Europe/Kiev" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
    });
    expect(spectator.element).toHaveExactText('2021-09-28 15:22:58');
  });

  it('converts date using custom date format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"Europe/Kiev":"dd/MM/yyyy" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
    });
    expect(spectator.element).toHaveExactText('28/09/2021 15:22:58');
  });

  it('converts date using custom time format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"Europe/Kiev":"":"HH:mm" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
    });
    expect(spectator.element).toHaveExactText('2021-09-28 15:22');
  });

  it('converts date using custom time format with old style " A" format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"Europe/Kiev":"":"hh:mm A" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
    });
    expect(spectator.element).toHaveExactText('2021-09-28 03:22 PM');
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
