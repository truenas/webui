import 'rxjs/Rx';
import 'rxjs/add/observable/throw';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/toPromise';

import { Injectable } from '@angular/core';
import {
  Headers,
  Http,
  Request,
  RequestMethod,
  RequestOptions,
  Response
} from '@angular/http';
import { Observable } from 'rxjs/Observable';

import { environment } from '../../environments/environment';

import { WebSocketService } from './ws.service';

@Injectable()
export class RestService {

  name: string;
  // needs to be more dynamic this should be changed later to use http or https
  // depending on if it is available
  private baseUrl = "/api/v1.0/";
  public openapi: Observable<Object>;

  constructor(private http: Http, private ws: WebSocketService) {
    const self = this;
    this.http = http;
    this.openapi = Observable.create(function (observer) {
      self.get('swagger.json', {}).subscribe((res) => {
        observer.next(res.data);
      });
    });
  }

  handleResponse(res: Response) {
    let range = res.headers.get("CONTENT-RANGE");
    let total = null;
    let data = null;

    if (range) {
      total = range.split('/');
      total = new Number(total[total.length - 1]);
    }
    if (res.status !== 204) {
      try {
        data = res.json();
      } catch (e) {
        data = res.text();
      }
    }

    return {
      data: data,
      code: res.status,
      total: total,
    };
  }

  handleError(error: any) {
    return Observable.throw({
      error: error.json(),
      code: error.status,
    });
  }

  request(method: RequestMethod, path: string, options: Object, useBaseUrl?: boolean) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': 'Token ' + this.ws.token
    });

    const requestUrl: string = (typeof (useBaseUrl) !== "undefined" && useBaseUrl === false)
      ? path : this.baseUrl + path;

    const requestOptions: Object = Object.assign(
      { method: method, url: requestUrl, headers: headers },
      options);
    return this.http.request(new Request(new RequestOptions(requestOptions)))
      .map(this.handleResponse)
      .catch(this.handleError);
  }

  buildOptions(options) {
    let result: Object = new Object();
    let search: Array<String> = [];
    for (let i in options) {
      if (i == 'offset') {
        search.push("offset(" + options[i] + ")=");
      } else if (i == 'sort') {
        search.push("sort(" + options[i] + ")=");
      } else {
        search.push(i + "=" + options[i]);
      }
    }
    result['search'] = search.join("&");
    return result;
  }

  get(path: string, options: Object, useBaseUrl?: boolean) {
    return this.request(RequestMethod.Get, path, this.buildOptions(options), useBaseUrl);
  }

  post(path: string, options: Object, useBaseUrl?: boolean) {
    return this.request(RequestMethod.Post, path, options, useBaseUrl);
  }

  put(path: string, options: Object, useBaseUrl?: boolean) {
    return this.request(RequestMethod.Put, path, options, useBaseUrl);
  }

  delete(path: string, options: Object, useBaseUrl?: boolean) {
    return this.request(RequestMethod.Delete, path, options, useBaseUrl);
  }
}
