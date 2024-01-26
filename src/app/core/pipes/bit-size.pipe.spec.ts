import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator/jest';
import { Base2BytesPipe } from 'app/core/pipes/base-2-bytes.pipe';

describe('BitSizePipe', () => {
  let spectator: SpectatorPipe<Base2BytesPipe>;
  const inputValue = 1024;
  const createPipe = createPipeFactory({
    pipe: Base2BytesPipe,
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
