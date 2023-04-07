import { Injectable } from '@angular/core';

// TODO: Just make a constant.
@Injectable({ providedIn: 'root' })
export class NameValidationService {
  nameRegex = /^[^/ *'"?@!#$%^&()+=~<>;`\\]+$/;
}
