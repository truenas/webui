import { FormControl, FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { CloudflareAuthValidator } from './cloudflare-auth.validator';

describe('CloudflareAuthValidator', () => {
  let translateService: TranslateService;
  let formGroup: FormGroup;

  beforeEach(() => {
    translateService = {
      instant: jest.fn((key: string) => key),
    } as unknown as TranslateService;

    formGroup = new FormGroup({
      cloudflare_email: new FormControl(''),
      api_key: new FormControl(''),
      api_token: new FormControl(''),
    });
  });

  describe('validateEmailFormat', () => {
    it('should return null when email is empty', () => {
      formGroup.patchValue({
        cloudflare_email: '',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareAuth: {
          message: 'Either API Token or Cloudflare Email + API Key must be provided',
        },
      });
    });

    it('should return error when email format is invalid', () => {
      formGroup.patchValue({
        cloudflare_email: 'invalid-email',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareEmailInvalid: {
          message: 'Cloudflare Email must be a valid email address',
        },
      });
    });

    it('should pass when email format is valid', () => {
      formGroup.patchValue({
        cloudflare_email: 'test@example.com',
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });
  });

  describe('validateMutualExclusivity', () => {
    it('should return error when both API Token and API Key are provided', () => {
      formGroup.patchValue({
        api_token: 'test_token',
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareMutuallyExclusive: {
          message: 'You can use either an API Token or the combination of Cloudflare Email + API Key, but not both',
        },
      });
    });

    it('should pass when only API Token is provided', () => {
      formGroup.patchValue({
        api_token: 'test_token',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });

    it('should pass when only API Key with Email is provided', () => {
      formGroup.patchValue({
        cloudflare_email: 'test@example.com',
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });
  });

  describe('validateEmailRequiresKey', () => {
    it('should return error when email is provided without API Key', () => {
      formGroup.patchValue({
        cloudflare_email: 'test@example.com',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareApiKey: {
          message: 'Cloudflare Email requires Global API Key',
        },
      });
    });

    it('should pass when email is provided with API Key', () => {
      formGroup.patchValue({
        cloudflare_email: 'test@example.com',
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });
  });

  describe('validateKeyRequiresEmail', () => {
    it('should return error when API Key is provided without email', () => {
      formGroup.patchValue({
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareEmailRequired: {
          message: 'API Key requires Cloudflare Email',
        },
      });
    });

    it('should pass when API Key is provided with email', () => {
      formGroup.patchValue({
        cloudflare_email: 'test@example.com',
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });
  });

  describe('validateAtLeastOneMethod', () => {
    it('should return error when neither API Token nor API Key is provided', () => {
      formGroup.patchValue({
        cloudflare_email: '',
        api_key: '',
        api_token: '',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareAuth: {
          message: 'Either API Token or Cloudflare Email + API Key must be provided',
        },
      });
    });

    it('should pass when API Token is provided', () => {
      formGroup.patchValue({
        api_token: 'test_token',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });

    it('should pass when API Key is provided with email', () => {
      formGroup.patchValue({
        cloudflare_email: 'test@example.com',
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });
  });

  describe('field value trimming', () => {
    it('should trim whitespace from field values', () => {
      formGroup.patchValue({
        cloudflare_email: '  test@example.com  ',
        api_key: '  test_key  ',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toBeNull();
    });

    it('should treat whitespace-only values as empty', () => {
      formGroup.patchValue({
        cloudflare_email: '   ',
        api_key: '   ',
        api_token: '   ',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareAuth: {
          message: 'Either API Token or Cloudflare Email + API Key must be provided',
        },
      });
    });
  });

  describe('validation order', () => {
    it('should validate email format before other validations', () => {
      formGroup.patchValue({
        cloudflare_email: 'invalid-email',
        api_key: 'test_key',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareEmailInvalid: {
          message: 'Cloudflare Email must be a valid email address',
        },
      });
    });

    it('should validate mutual exclusivity before dependency validations', () => {
      formGroup.patchValue({
        cloudflare_email: 'test@example.com',
        api_key: 'test_key',
        api_token: 'test_token',
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareMutuallyExclusive: {
          message: 'You can use either an API Token or the combination of Cloudflare Email + API Key, but not both',
        },
      });
    });
  });

  describe('edge cases', () => {
    it('should handle null values', () => {
      formGroup.patchValue({
        cloudflare_email: null,
        api_key: null,
        api_token: null,
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareAuth: {
          message: 'Either API Token or Cloudflare Email + API Key must be provided',
        },
      });
    });

    it('should handle undefined values', () => {
      formGroup.patchValue({
        cloudflare_email: undefined,
        api_key: undefined,
        api_token: undefined,
      });

      const result = CloudflareAuthValidator.validate(translateService)(formGroup);

      expect(result).toEqual({
        cloudflareAuth: {
          message: 'Either API Token or Cloudflare Email + API Key must be provided',
        },
      });
    });
  });
});
