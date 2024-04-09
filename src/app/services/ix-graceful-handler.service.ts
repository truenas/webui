import { ErrorHandler, Injectable } from '@angular/core';
import { IxGracefulUpdaterService } from 'app/services/ix-graceful-updater.service';

@Injectable()
export class IxGracefulHandlerService implements ErrorHandler {
  constructor(private guiService: IxGracefulUpdaterService) { }

  handleError(): void {
    this.guiService.hasError = true;
  }
}
