import { Injectable } from '@angular/core';
import { KiB } from 'app/constants/bytes.constant';

@Injectable({
  providedIn: 'root',
})
export class ErrorAccumulatorService {
  private errorLogs: string[] = [];
  private maxSizeLogs = KiB * 50;

  saveError(errorMsg: string): void {
    this.errorLogs.push(errorMsg);
    this.truncateErrors();
  }

  getErrorLogs(): string {
    return this.errorLogs.join('\n');
  }

  private truncateErrors(): void {
    if (JSON.stringify(this.errorLogs).length > this.maxSizeLogs) {
      this.errorLogs.shift();
      this.truncateErrors();
    }
  }
}
