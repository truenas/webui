import { Injectable } from '@angular/core';

// TODO: Replace with a constant.
@Injectable({ providedIn: 'root' })
export class NameValidationService {
  nameRegex = /^[^/ *'"?@!#$%^&()+=~<>;`\\]+$/;
}
