import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UrlValidationService {
  urlRegex = /^(https?|ftp|mqtt|ws|wss):\/\/([a-zA-Z0-9.-]+)(:[0-9]+)?(\/.*)?$/;
}
