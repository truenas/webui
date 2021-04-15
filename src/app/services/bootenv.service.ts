import { Injectable } from '@angular/core';

@Injectable()
export class BootEnvService {
  bootenv_name_regex = /^[^\/ *\'"?@!#$%^&()+=~<>;`\\]+$/;

  constructor() {}
}
