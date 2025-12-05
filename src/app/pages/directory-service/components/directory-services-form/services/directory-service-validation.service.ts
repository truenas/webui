import {
  Injectable, signal, computed,
} from '@angular/core';
import { FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';
import { DirectoryServiceType } from 'app/enums/directory-services.enum';

export interface ValidationState {
  isCredentialValid: boolean;
  isActiveDirectoryValid: boolean;
  isLdapValid: boolean;
  isIpaValid: boolean;
  isFormValid: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DirectoryServiceValidationService {
  private readonly credentialValid = signal(true);
  private readonly activeDirectoryValid = signal(true);
  private readonly ldapValid = signal(true);
  private readonly ipaValid = signal(true);

  readonly isCredentialValid = this.credentialValid.asReadonly();
  readonly isActiveDirectoryValid = this.activeDirectoryValid.asReadonly();
  readonly isLdapValid = this.ldapValid.asReadonly();
  readonly isIpaValid = this.ipaValid.asReadonly();

  readonly validationState = computed((): ValidationState => ({
    isCredentialValid: this.credentialValid(),
    isActiveDirectoryValid: this.activeDirectoryValid(),
    isLdapValid: this.ldapValid(),
    isIpaValid: this.ipaValid(),
    isFormValid: this.credentialValid() && this.activeDirectoryValid() && this.ldapValid() && this.ipaValid(),
  }));

  /**
   * Calculate overall form validity based on selected service type and component validities
   */
  calculateFormValidity(
    mainFormValid: boolean,
    selectedServiceType: DirectoryServiceType | null,
  ): boolean {
    const credentialValid = this.credentialValid();

    // Only validate the configuration component for the selected service type
    // If no service type is selected, form should be invalid
    let configValid = false;
    if (selectedServiceType === DirectoryServiceType.ActiveDirectory) {
      configValid = this.activeDirectoryValid();
    } else if (selectedServiceType === DirectoryServiceType.Ldap) {
      configValid = this.ldapValid();
    } else if (selectedServiceType === DirectoryServiceType.Ipa) {
      configValid = this.ipaValid();
    }

    return configValid && credentialValid && mainFormValid;
  }

  /**
   * Update credential validation state
   */
  setCredentialValid(isValid: boolean): void {
    this.credentialValid.set(isValid);
  }

  /**
   * Update Active Directory validation state
   */
  setActiveDirectoryValid(isValid: boolean): void {
    this.activeDirectoryValid.set(isValid);
  }

  /**
   * Update LDAP validation state
   */
  setLdapValid(isValid: boolean): void {
    this.ldapValid.set(isValid);
  }

  /**
   * Update IPA validation state
   */
  setIpaValid(isValid: boolean): void {
    this.ipaValid.set(isValid);
  }

  /**
   * Reset all validation states to valid (useful when switching service types)
   */
  resetValidationStates(): void {
    this.credentialValid.set(true);
    this.activeDirectoryValid.set(true);
    this.ldapValid.set(true);
    this.ipaValid.set(true);
  }

  /**
   * Reset validation states for service types that are not currently selected
   * This ensures that only the active service type's validation affects form validity
   */
  resetInactiveServiceValidation(activeServiceType: DirectoryServiceType | null): void {
    if (activeServiceType !== DirectoryServiceType.ActiveDirectory) {
      this.activeDirectoryValid.set(false);
    }
    if (activeServiceType !== DirectoryServiceType.Ldap) {
      this.ldapValid.set(false);
    }
    if (activeServiceType !== DirectoryServiceType.Ipa) {
      this.ipaValid.set(false);
    }
  }

  /**
   * Clear validation errors from form controls consistently
   */
  clearFormControlErrors(form: FormGroup, fieldName?: string): void {
    const clearControlErrors = (control: AbstractControl): void => {
      if (control.errors) {
        const filteredErrors = { ...control.errors };
        delete filteredErrors.manualValidateError;
        delete filteredErrors.manualValidateErrorMsg;
        delete filteredErrors.ixManualValidateError;

        const hasRemainingErrors = Object.keys(filteredErrors).length > 0;
        control.setErrors(hasRemainingErrors ? filteredErrors : null);
      }
    };

    if (fieldName && form.controls[fieldName]) {
      clearControlErrors(form.controls[fieldName]);
    } else {
      // Clear errors from all form controls
      Object.values(form.controls).forEach(clearControlErrors);
    }
  }

  /**
   * Utility method to disable form control and clear errors
   */
  disableAndClearControl(form: FormGroup, controlName: string): void {
    const control = form.controls[controlName];
    if (control) {
      control.clearValidators();
      control.setErrors(null);
      control.disable();
    }
  }

  /**
   * Utility method to enable form control with validators
   */
  enableControl(form: FormGroup, controlName: string, validators?: ValidatorFn[]): void {
    const control = form.controls[controlName];
    if (control) {
      control.enable();
      if (validators) {
        control.setValidators(validators);
        control.updateValueAndValidity();
      }
    }
  }
}
