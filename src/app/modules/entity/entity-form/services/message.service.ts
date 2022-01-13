import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private messageSource$ = new Subject<string>();
  messageSourceHasNewMessage$ = this.messageSource$.asObservable();

  newMessage(message: string): void {
    this.messageSource$.next(message);
  }
}
