import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator';
import { AppCatalogPipe } from './app-catalog.pipe';

describe('AppCatalogPipe', () => {
  let spectator: SpectatorPipe<AppCatalogPipe>;

  const createPipe = createPipeFactory({
    pipe: AppCatalogPipe,
  });

  it('transforms catalog app name for official catalog name', () => {
    spectator = createPipe('{{ inputValue | appCatalog }}', {
      hostProps: {
        inputValue: 'TRUENAS',
      },
    });

    expect(spectator.element.innerHTML).toBe('TrueNAS');
  });

  it('transforms catalog app name for titlecase', () => {
    spectator = createPipe('{{ inputValue | appCatalog }}', {
      hostProps: {
        inputValue: 'truecharts',
      },
    });

    expect(spectator.element.innerHTML).toBe('Truecharts');
  });
});
