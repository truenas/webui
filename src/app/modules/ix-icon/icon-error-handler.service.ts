import { ErrorHandler, Injectable } from '@angular/core';
import { environment } from 'environments/environment';

/**
 * Special service to augment error message when an icon is not found.
 */
@Injectable({
  providedIn: 'root',
})
export class IconErrorHandlerService {
  constructor(
    private normalErrorHandler: ErrorHandler,
  ) {}

  handleError(error: unknown): void {
    if (error instanceof Error && error.message.includes('Error retrieving icon') && !environment.production) {
      error.message += '. Check spelling and re-run build or use `yarn icons` to include icon in the sprite.';
    }

    this.normalErrorHandler.handleError(error);
  }
}
