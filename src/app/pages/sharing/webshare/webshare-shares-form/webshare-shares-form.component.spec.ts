import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { WebShare } from 'app/interfaces/webshare-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebShareValidatorService } from 'app/pages/sharing/webshare/webshare-validator.service';
import { WebShareFormData, WebShareSharesFormComponent } from './webshare-shares-form.component';

describe('WebShareSharesFormComponent', () => {
  let spectator: Spectator<WebShareSharesFormComponent>;
  let api: ApiService;

  beforeAll(() => {
    // Suppress console warnings about reactive form disabled state
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  const mockWebShares: WebShare[] = [
    { id: 1, name: 'documents', path: '/mnt/tank/documents' },
    { id: 2, name: 'media', path: '/mnt/tank/media' },
  ];

  const slideInRef: SlideInRef<WebShareFormData | undefined, { response: boolean; error: unknown }> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): WebShareFormData | undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: WebShareSharesFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      WebShareValidatorService,
      mockAuth(),
      mockApi([
        mockCall('sharing.webshare.query', mockWebShares),
        mockCall('sharing.webshare.create', mockWebShares[0]),
        mockCall('sharing.webshare.update', mockWebShares[0]),
        mockCall('filesystem.stat'),
      ]),
      mockProvider(SlideIn),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(TranslateService, {
        instant: jest.fn((key: string) => {
          // The marker function T() returns the string as-is, so just return the key
          // The TranslateService receives the actual string value from helptext
          return key;
        }),
        get: jest.fn(() => of({})),
        onLangChange: of({ lang: 'en' }),
        onTranslationChange: of({}),
        onDefaultLangChange: of({}),
      }),
      provideMockStore({
        selectors: [],
      }),
    ],
  });

  describe('Add new WebShare', () => {
    beforeEach(() => {
      // Mock console.warn for this test suite to avoid reactive form warnings
      jest.spyOn(console, 'warn').mockImplementation();

      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              isNew: true,
              name: '',
              path: '',
            } as WebShareFormData),
          }),
        ],
      });
      api = spectator.inject(ApiService);
      spectator.detectChanges();
    });

    it('should initialize form with default values for new share', () => {
      const form = spectator.component.form;
      expect(form.value).toEqual({
        name: '',
        path: '',
      });
      expect(form.controls.name.enabled).toBe(true);
    });

    it('should validate required fields', () => {
      const form = spectator.component.form;
      form.controls.name.setValue('');
      form.controls.path.setValue('');
      form.controls.name.markAsTouched();
      form.controls.path.markAsTouched();

      expect(form.controls.name.hasError('required')).toBe(true);
      expect(form.controls.path.hasError('required')).toBe(true);
    });

    it('should validate name pattern', () => {
      const form = spectator.component.form;
      form.controls.name.setValue('invalid name!');
      expect(form.controls.name.hasError('pattern')).toBe(true);

      form.controls.name.setValue('valid_name');
      expect(form.controls.name.hasError('pattern')).toBe(false);
    });

    it('should create new WebShare on submit', () => {
      // Use direct form controls instead of harness due to label translation issues
      const form = spectator.component.form;
      form.controls.name.setValue('new_share');
      form.controls.path.setValue('/mnt/tank/new_share');
      spectator.detectChanges();

      // Use spectator click instead of harness due to label issues
      const saveButton = spectator.query('button[type="submit"][mat-button]');
      spectator.click(saveButton);

      expect(api.call).toHaveBeenCalledWith('sharing.webshare.create', [{
        name: 'new_share',
        path: '/mnt/tank/new_share',
      }]);

      expect(slideInRef.close).toHaveBeenCalledWith({
        response: true,
        error: null,
      });
    });

    it('should handle API errors gracefully', () => {
      jest.spyOn(api, 'call')
        .mockImplementationOnce(() => of(mockWebShares)) // for shares load
        .mockImplementationOnce(() => throwError(() => new Error('API Error'))); // for create

      const errorHandler = spectator.inject(FormErrorHandlerService);
      const handleErrorSpy = jest.spyOn(errorHandler, 'handleValidationErrors');

      // Use direct form controls instead of harness due to label translation issues
      const form = spectator.component.form;
      form.controls.name.setValue('new_share');
      form.controls.path.setValue('/mnt/tank/new_share');
      spectator.detectChanges();

      // Use spectator click instead of harness due to label issues
      const saveButton = spectator.query('button[type="submit"][mat-button]');
      spectator.click(saveButton);

      expect(handleErrorSpy).toHaveBeenCalled();
    });
  });

  describe('Edit existing WebShare', () => {
    const editData: WebShareFormData = {
      id: 1,
      isNew: false,
      name: 'documents',
      path: '/mnt/tank/documents',
    };

    beforeEach(() => {
      // Mock console.warn for this test suite to avoid reactive form warnings
      jest.spyOn(console, 'warn').mockImplementation();

      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => editData,
          }),
        ],
      });
      api = spectator.inject(ApiService);
      spectator.detectChanges();
    });

    it('should populate form with existing share data', () => {
      const form = spectator.component.form;
      // Use getRawValue() to get disabled fields
      expect(form.getRawValue()).toEqual({
        name: 'documents',
        path: '/mnt/tank/documents',
      });
    });

    it('should allow editing name field when editing', () => {
      expect(spectator.component.form.controls.name.disabled).toBe(false);
      expect(spectator.component.form.controls.name.enabled).toBe(true);
    });

    it('should update existing WebShare on submit', () => {
      // Use direct form controls instead of harness due to label translation issues
      const form = spectator.component.form;
      form.controls.path.setValue('/mnt/tank/docs');
      spectator.detectChanges();

      // Use spectator click instead of harness due to label issues
      const saveButton = spectator.query('button[type="submit"][mat-button]');
      spectator.click(saveButton);

      expect(api.call).toHaveBeenCalledWith('sharing.webshare.update', [1, {
        name: 'documents',
        path: '/mnt/tank/docs',
      }]);
    });

    it('should allow updating the name when editing', () => {
      const form = spectator.component.form;
      form.controls.name.setValue('updated_documents');
      form.controls.path.setValue('/mnt/tank/docs');
      spectator.detectChanges();

      const saveButton = spectator.query('button[type="submit"][mat-button]');
      spectator.click(saveButton);

      expect(api.call).toHaveBeenCalledWith('sharing.webshare.update', [1, {
        name: 'updated_documents',
        path: '/mnt/tank/docs',
      }]);
    });

    it('should prevent renaming to an existing share name', async () => {
      const form = spectator.component.form;
      // Try to rename to 'media' which already exists
      form.controls.name.setValue('media');
      form.controls.name.markAsTouched();
      spectator.detectChanges();

      await spectator.fixture.whenStable();

      // The form should be invalid due to name conflict
      expect(form.controls.name.hasError('nameExists')).toBe(true);
    });
  });

  describe('Path auto-population', () => {
    beforeEach(() => {
      // Mock console.warn for this test suite to avoid reactive form warnings
      jest.spyOn(console, 'warn').mockImplementation();

      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, {
            ...slideInRef,
            getData: () => ({
              isNew: true,
              name: '',
              path: '',
            } as WebShareFormData),
          }),
        ],
      });
      spectator.detectChanges();
    });

    it('should auto-populate name from path when name is empty', () => {
      const form = spectator.component.form;

      // Simulate path change
      form.controls.path.setValue('/mnt/tank/my_share');
      spectator.detectChanges();

      expect(form.controls.name.value).toBe('my_share');
    });

    it('should not auto-populate name if already filled', () => {
      const form = spectator.component.form;

      form.controls.name.setValue('custom_name');
      form.controls.path.setValue('/mnt/tank/my_share');
      spectator.detectChanges();

      expect(form.controls.name.value).toBe('custom_name');
    });
  });


  describe('Cancel operation', () => {
    beforeEach(() => {
      // Mock console.warn for this test suite to avoid reactive form warnings
      jest.spyOn(console, 'warn').mockImplementation();

      spectator = createComponent();
      spectator.detectChanges();
    });

    it('should close slide-in when cancel is clicked', () => {
      // Use spectator click instead of harness due to label issues
      const cancelButton = spectator.query('button[type="button"][mat-button]');
      spectator.click(cancelButton);

      expect(slideInRef.close).toHaveBeenCalledWith({
        response: false,
        error: null,
      });
    });
  });
});
