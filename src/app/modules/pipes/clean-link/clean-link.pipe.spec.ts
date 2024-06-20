import { SpectatorPipe, createPipeFactory } from '@ngneat/spectator';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';

describe('CleanLinkPipe', () => {
  let spectator: SpectatorPipe<CleanLinkPipe>;
  const inputValue = 'https://www.google.com/test/';
  const createPipe = createPipeFactory({
    pipe: CleanLinkPipe,
  });
  const pipe = new CleanLinkPipe();

  it('transforms a URL into a shorter form as a function', () => {
    expect(pipe.transform('https://www.google.com/')).toBe('google.com');
    expect(pipe.transform('https://www.google.com/test/')).toBe('google.com/test');
  });

  it('transforms a URL into a shorter form in a template', () => {
    spectator = createPipe('{{ inputValue | cleanLink }}', {
      hostProps: {
        inputValue,
      },
    });

    expect(spectator.element.innerHTML).toBe('google.com/test');
  });
});
