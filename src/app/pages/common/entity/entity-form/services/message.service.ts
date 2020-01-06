import {Injectable,} from "@angular/core";
import { Subject ,  Observable } from 'rxjs';

@Injectable({providedIn: 'root'})
export class MessageService {
  private messageSource = new Subject<any>();
  public messageSourceHasNewMessage$ = this.messageSource.asObservable();
  constructor() {}
  newMessage(message){
    this.messageSource.next(message);
  }
}