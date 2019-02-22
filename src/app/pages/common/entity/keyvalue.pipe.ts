import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'keyvalue'
})
export class KeyvaluePipe implements PipeTransform {
    transform(value: any, args: any[] = null): any {
        const keys = [];
        for (const key in value) {
            keys.push({key: key, value: value[key]});
        }
        return keys;
    }
}