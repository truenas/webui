import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'convert'
})
export class ConvertPipe implements PipeTransform {

  transform(value: any, args: any): any {

    return this.calculate(value, args);
  }

  calculate(value, args){
    if(!value){ return 0.00;}
    let result;
    // uppercase so we handle bits and bytes...
    switch(args.toUpperCase()){
      case 'B TO KB':
        result = value / 1024;
        break;
      case 'B TO MB':
        result = value / 1024 / 1024;
        break;
      case 'B TO GB':
        result = value / 1024 / 1024 / 1024;
        break;
      case 'B TO TB':
        result = value / 1024 / 1024 / 1024;
        break;
      case 'B TO PB':
        result = value / 1024 / 1024 / 1024 / 1024;
        break;
      default:
        result = 0.00;
    }

    return result ? result.toFixed(2) : 0.00;
  }

}
