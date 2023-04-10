import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UrlValidationService {
  urlRegex = /^(?:http(s)?:\/\/)?[\w.-]+(?:\.[\w.-]+)+[\w\-._~:/?#[\]@!$&'()*+,;=.]+$/;
}
