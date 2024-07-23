import { createPipeFactory, SpectatorPipe } from '@ngneat/spectator/jest';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';

describe('OrNotAvailablePipe', () => {
  let spectator: SpectatorPipe<OrNotAvailablePipe>;
  const createPipe = createPipeFactory(OrNotAvailablePipe);

  it('returns original value when is it not null or undefined', () => {
    spectator = createPipe('{{ 123 | orNotAvailable }}');

    expect(spectator.element).toHaveText('123');
  });

  it('returns original value when is 0', () => {
    spectator = createPipe('{{ 0 | orNotAvailable }}');
    expect(spectator.element).toHaveText('0');
  });

  it('returns original value when is an empty string', () => {
    spectator = createPipe('{{ "" | orNotAvailable }}');
    expect(spectator.element).toHaveText('');
  });

  it('returns Not Available when value is undefined', () => {
    spectator = createPipe('{{ undefined | orNotAvailable }}');
    expect(spectator.element).toHaveText('N/A');
  });

  it('returns Not Available when value is null', () => {
    spectator = createPipe('{{ null | orNotAvailable }}');
    expect(spectator.element).toHaveText('N/A');
  });
});
