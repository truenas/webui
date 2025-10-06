import { AbstractControl, ValidationErrors } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

export class CloudflareAuthValidator {
  static validate(translate: TranslateService) {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const cloudflareEmail = CloudflareAuthValidator.getFieldValue(formGroup, 'cloudflare_email');
      const apiKey = CloudflareAuthValidator.getFieldValue(formGroup, 'api_key');
      const apiToken = CloudflareAuthValidator.getFieldValue(formGroup, 'api_token');

      return CloudflareAuthValidator.validateEmailFormat(cloudflareEmail, translate)
        || CloudflareAuthValidator.validateMutualExclusivity(apiToken, apiKey, translate)
        || CloudflareAuthValidator.validateEmailRequiresKey(cloudflareEmail, apiKey, translate)
        || CloudflareAuthValidator.validateKeyRequiresEmail(apiKey, cloudflareEmail, translate)
        || CloudflareAuthValidator.validateAtLeastOneMethod(apiToken, apiKey, translate)
        || null;
    };
  }

  private static getFieldValue(formGroup: AbstractControl, fieldName: string): string {
    return (formGroup.get(fieldName)?.value as string | null)?.trim() || '';
  }

  private static validateEmailFormat(email: string, translate: TranslateService): ValidationErrors | null {
    if (!email) return null;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        cloudflareEmailInvalid: {
          message: translate.instant('Cloudflare Email must be a valid email address'),
        },
      };
    }
    return null;
  }

  private static validateMutualExclusivity(
    apiToken: string,
    apiKey: string,
    translate: TranslateService,
  ): ValidationErrors | null {
    if (apiToken && apiKey) {
      return {
        cloudflareMutuallyExclusive: {
          message: translate.instant(
            'You can use either an API Token or the combination of Cloudflare Email + API Key, but not both',
          ),
        },
      };
    }
    return null;
  }

  private static validateEmailRequiresKey(
    email: string,
    apiKey: string,
    translate: TranslateService,
  ): ValidationErrors | null {
    if (email && !apiKey) {
      return {
        cloudflareApiKey: {
          message: translate.instant('Cloudflare Email requires Global API Key'),
        },
      };
    }
    return null;
  }

  private static validateKeyRequiresEmail(
    apiKey: string,
    email: string,
    translate: TranslateService,
  ): ValidationErrors | null {
    if (apiKey && !email) {
      return {
        cloudflareEmailRequired: {
          message: translate.instant('API Key requires Cloudflare Email'),
        },
      };
    }
    return null;
  }

  private static validateAtLeastOneMethod(
    apiToken: string,
    apiKey: string,
    translate: TranslateService,
  ): ValidationErrors | null {
    if (!apiToken && !apiKey) {
      return {
        cloudflareAuth: {
          message: translate.instant('Either API Token or Cloudflare Email + API Key must be provided'),
        },
      };
    }
    return null;
  }
}
