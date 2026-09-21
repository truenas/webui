/*
 * `document.execCommand` is deprecated, and exercising it is the point: it is
 * the only clipboard route available in an insecure context, so the fallback
 * has to be tested through the same API the CDK is obliged to call.
 */
/* eslint-disable sonarjs/deprecation */
import { TestBed } from '@angular/core/testing';
import { ClipboardService } from 'app/services/clipboard.service';

describe('ClipboardService', () => {
  let service: ClipboardService;
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  const originalExecCommand = document.execCommand;

  /**
   * `navigator.clipboard` is absent, not merely restricted, outside a secure
   * context — so the insecure case has to be modelled by removing it, not by
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
      // jsdom has no `navigator.clipboard` at all, so there is nothing to put
      // back — it has to be removed, or the property this spec defined stays
      // behind as `{ value: undefined }` and the next file's `jest.spyOn`
      // fails on a primitive.
      delete (navigator as { clipboard?: unknown }).clipboard;
    }
    document.execCommand = originalExecCommand;
    jest.restoreAllMocks();
  });

  describe('in a secure context', () => {
    it('uses the Clipboard API', async () => {
      const writeText = jest.fn(() => Promise.resolve());
      setClipboardApi({ writeText });

      await service.copy('thumbprint');

      expect(writeText).toHaveBeenCalledWith('thumbprint');
    });

    it('rejects when the Clipboard API does, rather than falling back', async () => {
      // A rejection here means the document was not focused or the permission
      // was refused — conditions execCommand is subject to as well — so the
      // failure is reported rather than retried into a silent one.
      setClipboardApi({ writeText: jest.fn(() => Promise.reject(new Error('denied'))) });
      document.execCommand = jest.fn(() => true);

      await expect(service.copy('thumbprint')).rejects.toThrow('denied');
      expect(document.execCommand).not.toHaveBeenCalled();
    });
  });

  describe('over plain HTTP, where navigator.clipboard is undefined', () => {
    beforeEach(() => setClipboardApi(undefined));

    it('still copies, via the execCommand fallback', async () => {
      let copiedValue: string | undefined;
      document.execCommand = jest.fn(() => {
        copiedValue = document.querySelector('textarea')?.value;
        return true;
      });

      await expect(service.copy('thumbprint')).resolves.toBeUndefined();

      expect(document.execCommand).toHaveBeenCalledWith('copy');
      expect(copiedValue).toBe('thumbprint');
    });

    it('rejects rather than throwing at the caller', async () => {
      // The whole bug: reading `.writeText` off an undefined `navigator.clipboard`
      // threw synchronously, so `.then(onSuccess, onError)` never ran and the
      // user got an unhandled error instead of the failure message.
      document.execCommand = jest.fn(() => false);

      await expect(service.copy('thumbprint')).rejects.toThrow('refused');
    });

    it('leaves no textarea behind, whether the copy works or not', async () => {
      document.execCommand = jest.fn(() => true);
      await service.copy('thumbprint');
      expect(document.querySelector('textarea')).toBeNull();

      document.execCommand = jest.fn(() => false);
      await expect(service.copy('thumbprint')).rejects.toThrow();
      expect(document.querySelector('textarea')).toBeNull();
    });

    // Focus restoration is deliberately not asserted here. The CDK's
    // `PendingCopy` does it, and jsdom's `textarea.select()` does not move
    // focus in the first place — so a test would either be exercising the
    // CDK's code or passing because nothing ever moved, which an earlier
    // version of this spec did.
  });
});
