import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator';
import { UptimePipe } from './uptime.pipe';

describe('UptimePipe', () => {
  let spectator: SpectatorPipe<UptimePipe>;

  const createPipe = createPipeFactory({
    pipe: UptimePipe,
  });

  it('should return N/A if uptime is 0', () => {
    const expectedValue = 'N/A';

    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 0,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });

  it('should return seconds if uptime less than 1 minute', () => {
    const expectedValue = '45 seconds as of 15:57';

    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 45,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });

  it('should return correct uptime string for uptime less than day', () => {
    const expectedValue = '23 hours 53 minutes 20 seconds as of 15:57';

    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 86000,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });

  it('should return correct uptime string for uptime greater than day', () => {
    const expectedValue = '9 days 22 hours 53 minutes as of 15:57';

    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 860000,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });

  it('should return minutes and seconds if uptime is between 1 minute and 1 hour', () => {
    const expectedValue = '12 minutes and 34 seconds as of 15:57';

    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 754,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });

  it('should return hours, minutes, and seconds if uptime is greater than 1 hour', () => {
    const expectedValue = '2 hours, 5 minutes, and 30 seconds as of 15:57';

    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 7530,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });

  it('should handle missing date/time input', () => {
    const expectedValue = '1 hour, 15 minutes, and 30 seconds';

    spectator = createPipe('{{ inputValue | uptime }}', {
      hostProps: {
        inputValue: 4530,
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });

  it('should handle invalid input', () => {
    const expectedValue = 'N/A';

    spectator = createPipe('{{ inputValue | uptime }}', {
      hostProps: {
        inputValue: 'invalid',
      },
    });

    expect(spectator.element.innerHTML).toEqual(expectedValue);
  });
});
