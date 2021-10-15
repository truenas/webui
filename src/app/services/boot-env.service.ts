import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BootEnvService {
  bootenv_name_regex = /^[^\/ *\'"?@!#$%^&()+=~<>;`\\]+$/;
}
