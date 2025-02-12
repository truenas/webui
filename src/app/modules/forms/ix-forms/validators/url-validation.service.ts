import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UrlValidationService {
  urlRegex = /^([a-zA-Z][a-zA-Z\d+\-.]*):\/\/([^\s:/?#]+)(:\d{1,5})?(\/[^\s]*)?$/;
}
