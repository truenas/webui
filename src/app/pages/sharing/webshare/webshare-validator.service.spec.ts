import { TestBed } from '@angular/core/testing';
import { FormControl, ValidationErrors } from '@angular/forms';
import { signal } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareValidatorService } from './webshare-validator.service';

describe('WebShareValidatorService', () => {
  let service: WebShareValidatorService;
  let api: ApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WebShareValidatorService,
        mockApi([
          mockCall('filesystem.stat', { id: 'test' } as never),
        ]),
      ],
    });

    service = TestBed.inject(WebShareValidatorService);
    api = TestBed.inject(ApiService);
  });

  describe('validateWebShareName', () => {
    it('returns null for empty value', (done) => {
      const shares = signal<WebShare[]>([]);
      const validator = service.validateWebShareName(shares);
      const control = new FormControl('');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('returns error when name already exists', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/documents' } as WebShare,
      ]);
      const validator = service.validateWebShareName(shares);
      const control = new FormControl('documents');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toEqual({
          nameExists: { message: 'A WebShare with this name already exists' },
        });
        done();
      });
    });

    it('allows name when editing the same share', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/documents' } as WebShare,
      ]);
      const validator = service.validateWebShareName(shares, 1);
      const control = new FormControl('documents');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('allows unique name', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/documents' } as WebShare,
      ]);
      const validator = service.validateWebShareName(shares);
      const control = new FormControl('media');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toBeNull();
        done();
      });
    });
  });

  describe('validateWebSharePath', () => {
    it('returns null for empty value', () => {
      const validator = service.validateWebSharePath();
      const control = new FormControl('');

      const result = validator(control);

      expect(result).toBeNull();
    });

    it('rejects paths not under /mnt/', () => {
      const validator = service.validateWebSharePath();
      const testCases = [
        '/etc/passwd',
        '/home/user',
        '/var/log',
        '/root',
      ];

      testCases.forEach((path) => {
        const control = new FormControl(path);
        const result = validator(control);

        expect(result).toEqual({
          pathInvalid: { message: 'Path must be under /mnt/<poolname>/' },
        });
      });
    });

    it('rejects root dataset paths (/mnt/pool)', () => {
      const validator = service.validateWebSharePath();
      const testCases = [
        '/mnt/pool',
        '/mnt/tank',
        '/mnt/mypool',
      ];

      testCases.forEach((path) => {
        const control = new FormControl(path);
        const result = validator(control);

        expect(result).toEqual({
          rootDataset: { message: 'Sharing root datasets is not recommended. Please select a subdirectory.' },
        });
      });
    });

    it('rejects root dataset paths with trailing slash (/mnt/pool/)', () => {
      const validator = service.validateWebSharePath();
      const testCases = [
        '/mnt/pool/',
        '/mnt/tank/',
        '/mnt/mypool/',
      ];

      testCases.forEach((path) => {
        const control = new FormControl(path);
        const result = validator(control);

        expect(result).toEqual({
          rootDataset: { message: 'Sharing root datasets is not recommended. Please select a subdirectory.' },
        });
      });
    });

    it('accepts valid dataset paths', () => {
      const validator = service.validateWebSharePath();
      const testCases = [
        '/mnt/tank/documents',
        '/mnt/pool/media',
        '/mnt/tank/backups/important',
      ];

      testCases.forEach((path) => {
        const control = new FormControl(path);
        const result = validator(control);

        expect(result).toBeNull();
      });
    });

    it('handles multiple consecutive slashes correctly', () => {
      const validator = service.validateWebSharePath();

      // Multiple slashes should be normalized and still validate correctly
      const control = new FormControl('/mnt/pool//dataset');
      const result = validator(control);

      // Should accept as valid path (not root dataset)
      expect(result).toBeNull();
    });

    it('handles path traversal attempts with .. segments', () => {
      const validator = service.validateWebSharePath();

      // Path traversal that escapes /mnt/ should be rejected
      const control = new FormControl('/mnt/../etc/passwd');
      const result = validator(control);

      // Should reject as it normalizes to /etc/passwd which is not under /mnt/
      expect(result).toEqual({
        pathInvalid: { message: 'Path must be under /mnt/<poolname>/' },
      });
    });

    it('handles . (current directory) segments', () => {
      const validator = service.validateWebSharePath();

      const control = new FormControl('/mnt/tank/./documents');
      const result = validator(control);

      // Should accept as it normalizes to /mnt/tank/documents
      expect(result).toBeNull();
    });

    it('rejects path that normalizes to root dataset', () => {
      const validator = service.validateWebSharePath();

      // /mnt/tank/subdir/.. should normalize to /mnt/tank (root dataset)
      const control = new FormControl('/mnt/tank/subdir/..');
      const result = validator(control);

      expect(result).toEqual({
        rootDataset: { message: 'Sharing root datasets is not recommended. Please select a subdirectory.' },
      });
    });
  });

  describe('validateWebSharePathNesting', () => {
    it('returns null for empty value', (done) => {
      const shares = signal<WebShare[]>([]);
      const validator = service.validateWebSharePathNesting(shares);
      const control = new FormControl('');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('rejects exact duplicate path', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/documents' } as WebShare,
      ]);
      const validator = service.validateWebSharePathNesting(shares);
      const control = new FormControl('/mnt/tank/documents');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toEqual({
          pathNested: {
            message: 'This path is already covered by the WebShare "documents" at /mnt/tank/documents',
          },
        });
        done();
      });
    });

    it('rejects path nested inside existing share', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/documents' } as WebShare,
      ]);
      const validator = service.validateWebSharePathNesting(shares);
      const control = new FormControl('/mnt/tank/documents/private');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toEqual({
          pathNested: {
            message: 'This path is already covered by the WebShare "documents" at /mnt/tank/documents',
          },
        });
        done();
      });
    });

    it('rejects path that contains existing share', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/data/documents' } as WebShare,
      ]);
      const validator = service.validateWebSharePathNesting(shares);
      const control = new FormControl('/mnt/tank/data');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toEqual({
          pathContainsExisting: {
            message: 'This path would include the existing WebShare "documents" at /mnt/tank/data/documents',
          },
        });
        done();
      });
    });

    it('allows path when editing the same share', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/documents' } as WebShare,
      ]);
      const validator = service.validateWebSharePathNesting(shares, 1);
      const control = new FormControl('/mnt/tank/documents');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toBeNull();
        done();
      });
    });

    it('does not match partial directory names', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'foo', path: '/mnt/tank/foo' } as WebShare,
      ]);
      const validator = service.validateWebSharePathNesting(shares);
      const control = new FormControl('/mnt/tank/foobar');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        // Should be null because /mnt/tank/foobar is not nested in /mnt/tank/foo
        expect(result).toBeNull();
        done();
      });
    });

    it('returns error when path does not exist', (done) => {
      jest.spyOn(api, 'call').mockReturnValue(throwError(() => new Error('Path not found')));

      const shares = signal<WebShare[]>([]);
      const validator = service.validateWebSharePathNesting(shares);
      const control = new FormControl('/mnt/tank/nonexistent');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toEqual({
          pathNotFound: { message: 'Path does not exist' },
        });
        done();
      });
    });

    it('handles trailing slashes in existing paths', (done) => {
      const shares = signal<WebShare[]>([
        { id: 1, name: 'documents', path: '/mnt/tank/documents/' } as WebShare,
      ]);
      const validator = service.validateWebSharePathNesting(shares);
      const control = new FormControl('/mnt/tank/documents/private');

      (validator(control) as Observable<ValidationErrors | null>).subscribe((result: ValidationErrors | null) => {
        expect(result).toEqual({
          pathNested: {
            message: 'This path is already covered by the WebShare "documents" at /mnt/tank/documents',
          },
        });
        done();
      });
    });
  });
});
