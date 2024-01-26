import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { Base2SizePipe } from 'app/core/pipes/base-2-size.pipe';

describe('BitSizePipe', () => {
  let spectator: SpectatorPipe<Base2SizePipe>;
  const inputValue = 1024;
  const createPipe = createPipeFactory({
    pipe: Base2SizePipe,
  });

  beforeEach(() => {
    spectator = createPipe('{{ inputValue | bits }}', {
      hostProps: {
        inputValue,
      },
    });
  });

  it('converts bits to proper unit', () => {
    expect(spectator.element.innerHTML).toBe('1.2 kbit');
  });
});
