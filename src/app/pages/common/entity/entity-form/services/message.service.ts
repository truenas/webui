import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

@Injectable()
export class MessageService {
  private messageSource = new Subject<any>();
  messageSourceHasNewMessage$ = this.messageSource.asObservable();
  constructor() {}
  newMessage(message: any) {
    this.messageSource.next(message);
  }
}
