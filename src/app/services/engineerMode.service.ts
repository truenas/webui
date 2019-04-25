import { Injectable, EventEmitter} from '@angular/core';

@Injectable()
export class EngineerModeService {
    engineerMode = new EventEmitter();
}