import { Injectable } from '@angular/core';
import { KiB } from 'app/constants/bytes.constant';

@Injectable({
  providedIn: 'root',
})
export class ErrorAccumulatorService {
  private errorLogs: string[] = [];
  private maxLength = KiB * 50;

  appendError(errorMsg: string): void {
    this.errorLogs.push(errorMsg);
    this.truncateErrors();
  }

  getErrorLogs(): string {
    return this.errorLogs.join('\n');
  }

  private truncateErrors(): void {
    if (JSON.stringify(this.errorLogs).length > this.maxLength) {
      this.errorLogs.shift();
      this.truncateErrors();
    }
  }
}
