import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator';
import { UptimePipe } from './uptime.pipe';

describe('UptimePipe', () => {
  let spectator: SpectatorPipe<UptimePipe>;

  const createPipe = createPipeFactory({
    pipe: UptimePipe,
  });

  it('should return seconds if uptime less than 1 minute', () => {
    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 45,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toBe('45 seconds as of 15:57');
  });

  it('should return correct uptime string for uptime less than 1 day', () => {
    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 86000,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toBe('23 hours 53 minutes 20 seconds as of 15:57');
  });

  it('should return correct uptime string for uptime greater than 1 day', () => {
    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 860000,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toBe('9 days 22 hours 53 minutes as of 15:57');
  });

  it('should return minutes and seconds if uptime is between 1 minute and 1 hour', () => {
    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 754,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toBe('12 minutes 34 seconds as of 15:57');
  });

  it('should return hours, minutes, and seconds if uptime is greater than 1 hour', () => {
    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 7530,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toBe('2 hours 5 minutes 30 seconds as of 15:57');
  });

  it('should handle missing date/time input', () => {
    spectator = createPipe('{{ inputValue | uptime }}', {
      hostProps: {
        inputValue: 4530,
      },
    });

    expect(spectator.element.innerHTML).toBe('1 hour 15 minutes 30 seconds');
  });

  it('should return N/A if uptime is 0', () => {
    spectator = createPipe('{{ inputValue | uptime:dateTime }}', {
      hostProps: {
        inputValue: 0,
        dateTime: '15:57',
      },
    });

    expect(spectator.element.innerHTML).toBe('N/A');
  });

  it('should return N/A if invalid input', () => {
    spectator = createPipe('{{ inputValue | uptime }}', {
      hostProps: {
        inputValue: 'invalid',
      },
    });

    expect(spectator.element.innerHTML).toBe('N/A');
  });
});
