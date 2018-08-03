import { Injectable } from '@angular/core';


@Injectable()
export class BootEnvService {
  public bootenv_name_regex = /^[^\/ *\'"?@!#$%^&()+=~<>;`\\]+$/;

  constructor() {};

}