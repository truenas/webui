/*
 * `document.execCommand` is deprecated, and exercising it is the point: it is
 * the only clipboard route available in an insecure context, so the fallback
 * has to be tested through the same API the service is obliged to call.
 */
/* eslint-disable sonarjs/deprecation */
import { TestBed } from '@angular/core/testing';
import { ClipboardService } from 'app/services/clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  /**
   * `navigator.clipboard` is absent, not merely restricted, outside a secure
   * context — so the insecure case has to be modelled by deleting it, not by
   * making `writeText` reject.
   */
  function setClipboardApi(value: Pick<Clipboard, 'writeText'> | undefined): void {
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
  }

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClipboardService);
  });

  afterEach(() => {
    if (originalClipboard) {
      Object.defineProperty(navigator, 'clipboard', originalClipboard);
    } else {
      setClipboardApi(undefined);
    }
    jest.restoreAllMocks();
  });

  describe('in a secure context', () => {
    it('uses the Clipboard API', async () => {
      const writeText = jest.fn(() => Promise.resolve());
      setClipboardApi({ writeText });

      await service.copy('thumbprint');

      expect(writeText).toHaveBeenCalledWith('thumbprint');
    });

    it('rejects when the Clipboard API does', async () => {
      setClipboardApi({ writeText: jest.fn(() => Promise.reject(new Error('denied'))) });

      await expect(service.copy('thumbprint')).rejects.toThrow('denied');
    });
  });

  describe('over plain HTTP, where navigator.clipboard is undefined', () => {
    beforeEach(() => setClipboardApi(undefined));

    it('still copies, via the execCommand fallback', async () => {
      const execCommand = jest.fn(() => true);
      document.execCommand = execCommand;

      await expect(service.copy('thumbprint')).resolves.toBeUndefined();

      expect(execCommand).toHaveBeenCalledWith('copy');
    });

    it('rejects rather than throwing at the caller', async () => {
      // The whole bug: reading `.writeText` off an undefined `navigator.clipboard`
      // threw synchronously, so `.then(onSuccess, onError)` never ran and the
      // user got an unhandled error instead of the failure message.
      document.execCommand = jest.fn(() => false);

      await expect(service.copy('thumbprint')).rejects.toThrow('refused');
    });

    it('puts the text on the page for the copy, and cleans up afterwards', async () => {
      let valueAtCopyTime: string | undefined;
      document.execCommand = jest.fn(() => {
        valueAtCopyTime = document.querySelector('textarea')?.value;
        return true;
      });

      await service.copy('thumbprint');

      expect(valueAtCopyTime).toBe('thumbprint');
      expect(document.querySelector('textarea')).toBeNull();
    });

    it('leaves focus where it found it', async () => {
      // Two of the call sites are dialogs with a focus trap, and the fallback
      // has to steal focus to select the text.
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      document.execCommand = jest.fn(() => true);

      await service.copy('thumbprint');

      expect(document.activeElement).toBe(button);
      button.remove();
    });

    it('removes the textarea even when the copy throws', async () => {
      document.execCommand = jest.fn(() => {
        throw new Error('boom');
      });

      await expect(service.copy('thumbprint')).rejects.toThrow('boom');
      expect(document.querySelector('textarea')).toBeNull();
    });
  });
});
