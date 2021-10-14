import { createPipeFactory, mockProvider, SpectatorPipe } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { SystemGeneralService } from 'app/services';

describe('FormatDateTimePipe', () => {
  let spectator: SpectatorPipe<FormatDateTimePipe>;
  const inputValue = 1632831778445;
  const createPipe = createPipeFactory(FormatDateTimePipe);

  it('converts timestamp to date', () => {
    spectator = createPipe('{{ 1632831778445 | formatDateTime:"America/Los_Angeles" }}', {
      providers: [mockProvider(SystemGeneralService, {
        getGeneralConfig$: of(),
      })],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 05:22:58');
  });

  it('converts timestamp using timezone from pipe args', () => {
    spectator = createPipe('{{ inputValue | formatDateTime:"America/Los_Angeles" }}', {
      hostProps: {
        inputValue,
      },
      providers: [mockProvider(SystemGeneralService, {
        getGeneralConfig$: of(),
      })],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 05:22:58');
  });

  it('converts timestamp to UTC timezone', () => {
    spectator = createPipe('{{ inputValue | formatDateTime }}', {
      hostProps: {
        inputValue,
      },
      providers: [mockProvider(SystemGeneralService, {
        getGeneralConfig$: of({ timezone: 'UTC' }),
      })],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 12:22:58');
  });

  it('converts timestamp to Europe/Kiev timezone', () => {
    spectator = createPipe('{{ inputValue | formatDateTime }}', {
      hostProps: {
        inputValue,
      },
      providers: [mockProvider(SystemGeneralService, {
        getGeneralConfig$: of({ timezone: 'Europe/Kiev' }),
      })],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 15:22:58');
  });

  it('converts date to Europe/Kiev timezone', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"Europe/Kiev" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
      providers: [mockProvider(SystemGeneralService, {
        getGeneralConfig$: of(),
      })],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 15:22:58');
  });

  it('converts date using custom date format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"Europe/Kiev":"dd/MM/yyyy" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
      providers: [mockProvider(SystemGeneralService, {
        getGeneralConfig$: of(),
      })],
    });
    expect(spectator.element).toHaveExactText('28/09/2021 15:22:58');
  });

  it('converts date using custom time format', () => {
    spectator = createPipe('{{ inputDateValue | formatDateTime:"Europe/Kiev":"":"HH:mm" }}', {
      hostProps: {
        inputDateValue: new Date(inputValue),
      },
      providers: [mockProvider(SystemGeneralService, {
        getGeneralConfig$: of(),
      })],
    });
    expect(spectator.element).toHaveExactText('2021-09-28 15:22');
  });
});
