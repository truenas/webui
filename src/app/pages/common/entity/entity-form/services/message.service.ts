import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private messageSource$ = new Subject<any>();
  messageSourceHasNewMessage$ = this.messageSource$.asObservable();

  newMessage(message: any): void {
    this.messageSource$.next(message);
  }
}
