import { NavigationError, Event as RouterEvent } from '@angular/router';
import { chunkReloadKey, handleChunkLoadError } from 'app/helpers/handle-chunk-load-error';

describe('handleChunkLoadError', () => {
  let mockWindow: Window;

  beforeEach(() => {
    mockWindow = {
      sessionStorage: {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      location: { reload: jest.fn() },
      document: { body: { innerHTML: '' } },
    } as unknown as Window;
  });

  function makeNavigationError(message: string): NavigationError {
    return {
      id: 1,
      url: '/test',
      error: new Error(message),
      type: 2 as unknown as RouterEvent,
    } as unknown as NavigationError;
  }

  it('reloads on first chunk load failure', () => {
    handleChunkLoadError(makeNavigationError('Loading chunk 123 failed'), mockWindow);

    expect(mockWindow.sessionStorage.setItem).toHaveBeenCalledWith(chunkReloadKey, expect.any(String));
    expect(mockWindow.location.reload).toHaveBeenCalled();
  });

  it('reloads on dynamic import failure', () => {
    handleChunkLoadError(makeNavigationError('Failed to fetch dynamically imported module'), mockWindow);

    expect(mockWindow.location.reload).toHaveBeenCalled();
  });

  it('shows fallback message when reload was recently attempted', () => {
    (mockWindow.sessionStorage.getItem as jest.Mock).mockReturnValue(String(Date.now()));

    handleChunkLoadError(makeNavigationError('Loading chunk 5 failed'), mockWindow);

    expect(mockWindow.location.reload).not.toHaveBeenCalled();
    expect(mockWindow.sessionStorage.removeItem).toHaveBeenCalledWith(chunkReloadKey);
    expect(mockWindow.document.body.innerHTML).toContain('Click here to refresh');
  });

  it('retries reload when previous attempt was long ago', () => {
    (mockWindow.sessionStorage.getItem as jest.Mock).mockReturnValue(String(Date.now() - 60_000));

    handleChunkLoadError(makeNavigationError('Loading chunk 5 failed'), mockWindow);

    expect(mockWindow.location.reload).toHaveBeenCalled();
  });

  it('falls back to reload when sessionStorage throws', () => {
    (mockWindow.sessionStorage.getItem as jest.Mock).mockImplementation(() => {
      throw new Error('SecurityError');
    });

    handleChunkLoadError(makeNavigationError('Loading chunk 5 failed'), mockWindow);

    expect(mockWindow.location.reload).toHaveBeenCalled();
  });

  it('does not reload for non-chunk navigation errors', () => {
    jest.spyOn(console, 'error').mockImplementation();

    handleChunkLoadError(makeNavigationError('Cannot match route /foo'), mockWindow);

    expect(mockWindow.location.reload).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });
});
