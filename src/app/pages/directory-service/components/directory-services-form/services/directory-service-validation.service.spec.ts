import { TestBed } from '@angular/core/testing';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DirectoryServiceType } from 'app/enums/directory-services.enum';
import { DirectoryServiceValidationService } from './directory-service-validation.service';

describe('DirectoryServiceValidationService', () => {
  let service: DirectoryServiceValidationService;
  let formBuilder: FormBuilder;
  let testForm: FormGroup;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DirectoryServiceValidationService);
    formBuilder = TestBed.inject(FormBuilder);

    testForm = formBuilder.group({
      service_type: [null, Validators.required],
      enable: [false, Validators.required],
      field1: ['', Validators.required],
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('validation state management', () => {
    it('should start with all validation states as true', () => {
      expect(service.isCredentialValid()).toBe(true);
      expect(service.isActiveDirectoryValid()).toBe(true);
      expect(service.isLdapValid()).toBe(true);
      expect(service.isIpaValid()).toBe(true);
    });

    it('should update credential validation state', () => {
      service.setCredentialValid(false);
      expect(service.isCredentialValid()).toBe(false);
    });

    it('should update Active Directory validation state', () => {
      service.setActiveDirectoryValid(false);
      expect(service.isActiveDirectoryValid()).toBe(false);
    });

    it('should update LDAP validation state', () => {
      service.setLdapValid(false);
      expect(service.isLdapValid()).toBe(false);
    });

    it('should update IPA validation state', () => {
      service.setIpaValid(false);
      expect(service.isIpaValid()).toBe(false);
    });
  });

  describe('calculateFormValidity', () => {
    it('should return false when no service type is selected', () => {
      testForm.patchValue({ service_type: null });
      const isValid = service.calculateFormValidity(testForm, null);
      expect(isValid).toBe(false);
    });

    it('should return true when Active Directory is selected and all validations pass', () => {
      testForm.patchValue({
        service_type: DirectoryServiceType.ActiveDirectory,
        enable: true,
        field1: 'test',
      });
      service.setActiveDirectoryValid(true);
      service.setCredentialValid(true);

      const isValid = service.calculateFormValidity(testForm, DirectoryServiceType.ActiveDirectory);
      expect(isValid).toBe(true);
    });

    it('should return false when Active Directory is selected but AD validation fails', () => {
      testForm.patchValue({
        service_type: DirectoryServiceType.ActiveDirectory,
        enable: true,
        field1: 'test',
      });
      service.setActiveDirectoryValid(false);
      service.setCredentialValid(true);

      const isValid = service.calculateFormValidity(testForm, DirectoryServiceType.ActiveDirectory);
      expect(isValid).toBe(false);
    });

    it('should return false when credential validation fails', () => {
      testForm.patchValue({
        service_type: DirectoryServiceType.ActiveDirectory,
        enable: true,
        field1: 'test',
      });
      service.setActiveDirectoryValid(true);
      service.setCredentialValid(false);

      const isValid = service.calculateFormValidity(testForm, DirectoryServiceType.ActiveDirectory);
      expect(isValid).toBe(false);
    });

    it('should return false when main form is invalid', () => {
      testForm.patchValue({
        service_type: DirectoryServiceType.ActiveDirectory,
        enable: true,
        field1: '', // This will make form invalid due to required validator
      });
      service.setActiveDirectoryValid(true);
      service.setCredentialValid(true);

      const isValid = service.calculateFormValidity(testForm, DirectoryServiceType.ActiveDirectory);
      expect(isValid).toBe(false);
    });

    it('should only validate the selected service type', () => {
      testForm.patchValue({
        service_type: DirectoryServiceType.Ldap,
        enable: true,
        field1: 'test',
      });
      service.setActiveDirectoryValid(false); // This should not affect validation
      service.setLdapValid(true);
      service.setCredentialValid(true);

      const isValid = service.calculateFormValidity(testForm, DirectoryServiceType.Ldap);
      expect(isValid).toBe(true);
    });
  });

  describe('resetInactiveServiceValidation', () => {
    beforeEach(() => {
      // Set all validations to true initially
      service.setActiveDirectoryValid(true);
      service.setLdapValid(true);
      service.setIpaValid(true);
    });

    it('should reset non-active service validations to false when Active Directory is selected', () => {
      service.resetInactiveServiceValidation(DirectoryServiceType.ActiveDirectory);

      expect(service.isActiveDirectoryValid()).toBe(true);
      expect(service.isLdapValid()).toBe(false);
      expect(service.isIpaValid()).toBe(false);
    });

    it('should reset non-active service validations to false when LDAP is selected', () => {
      service.resetInactiveServiceValidation(DirectoryServiceType.Ldap);

      expect(service.isActiveDirectoryValid()).toBe(false);
      expect(service.isLdapValid()).toBe(true);
      expect(service.isIpaValid()).toBe(false);
    });

    it('should reset non-active service validations to false when IPA is selected', () => {
      service.resetInactiveServiceValidation(DirectoryServiceType.Ipa);

      expect(service.isActiveDirectoryValid()).toBe(false);
      expect(service.isLdapValid()).toBe(false);
      expect(service.isIpaValid()).toBe(true);
    });

    it('should reset all service validations to false when no service type is selected', () => {
      service.resetInactiveServiceValidation(null);

      expect(service.isActiveDirectoryValid()).toBe(false);
      expect(service.isLdapValid()).toBe(false);
      expect(service.isIpaValid()).toBe(false);
    });
  });

  describe('form control utilities', () => {
    let formForUtilityTests: FormGroup;

    beforeEach(() => {
      formForUtilityTests = formBuilder.group({
        field1: ['test', Validators.required],
        field2: ['', Validators.required],
      });

      // Add some manual validation errors
      formForUtilityTests.controls.field1.setErrors({
        manualValidateError: true,
        ixManualValidateError: 'Custom error',
        otherError: 'Should remain',
      });
    });

    it('should clear manual validation errors while preserving other errors', () => {
      service.clearFormControlErrors(formForUtilityTests);

      const field1Errors = formForUtilityTests.controls.field1.errors;
      expect(field1Errors).toEqual({ otherError: 'Should remain' });
    });

    it('should clear all errors if only manual errors exist', () => {
      formForUtilityTests.controls.field2.setErrors({
        manualValidateError: true,
        ixManualValidateError: 'Custom error',
      });

      service.clearFormControlErrors(formForUtilityTests);

      expect(formForUtilityTests.controls.field2.errors).toBeNull();
    });

    it('should disable and clear control properly', () => {
      const control = formForUtilityTests.controls.field1;
      control.setValidators([Validators.required, Validators.minLength(3)]);
      control.setErrors({ someError: true });

      service.disableAndClearControl(formForUtilityTests, 'field1');

      expect(control.disabled).toBe(true);
      expect(control.errors).toBeNull();
      expect(control.hasError('required')).toBe(false);
    });

    it('should enable control with validators', () => {
      const control = formForUtilityTests.controls.field1;
      control.disable();

      service.enableControl(formForUtilityTests, 'field1', [Validators.required, Validators.minLength(3)]);

      expect(control.enabled).toBe(true);
      control.setValue('');
      expect(control.hasError('required')).toBe(true);
    });

    it('should enable control without validators', () => {
      const control = formForUtilityTests.controls.field1;
      control.disable();
      control.setValidators([Validators.required]);

      service.enableControl(formForUtilityTests, 'field1');

      expect(control.enabled).toBe(true);
      // Should still have the original validators
      control.setValue('');
      expect(control.hasError('required')).toBe(true);
    });
  });

  describe('resetValidationStates', () => {
    it('should reset all validation states to true', () => {
      // Set all to false first
      service.setCredentialValid(false);
      service.setActiveDirectoryValid(false);
      service.setLdapValid(false);
      service.setIpaValid(false);

      service.resetValidationStates();

      expect(service.isCredentialValid()).toBe(true);
      expect(service.isActiveDirectoryValid()).toBe(true);
      expect(service.isLdapValid()).toBe(true);
      expect(service.isIpaValid()).toBe(true);
    });
  });
});
