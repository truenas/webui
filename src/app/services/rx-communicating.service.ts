import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Subject } from 'rxjs/Subject';

@Injectable()
export class RxCommunicatingService {
	private subject = new Subject<any>();

	sendDataToAll(params?: any) {
		this.subject.next(params);
	}

	getDataFromOrigin(): Observable<any> {
		return this.subject.asObservable();
	}
}