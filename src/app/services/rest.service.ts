import { throwError as observableThrowError, Observable } from 'rxjs';

import { catchError, map } from 'rxjs/operators';
import 'rxjs/Rx';

import { Injectable } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { WebSocketService } from './ws.service';

@Injectable()
export class RestService {
  name: string;
  // needs to be more dynamic this should be changed later to use http or https
  // depending on if it is available
  private baseUrl = '/api/v1.0/';
  openapi: Observable<Object>;

  constructor(private http: HttpClient, private ws: WebSocketService) {
    const self = this;
    this.http = http;
    this.openapi = Observable.create((observer) => {
      /*      self.get('swagger.json', {}).subscribe((res) => {
        observer.next(res.data);
      }); */
    });
  }

  handleResponse(res: Response) {
    const range = res.headers.get('CONTENT-RANGE');
    let total = null;
    let data = null;

    if (range) {
      total = range.split('/');
      total = Number(total[total.length - 1]);
    }
    if (res.status !== 204) {
      try {
        data = res.json();
      } catch (e) {
        data = res.text();
      }
    }

    return {
      data,
      code: res.status,
      total,
    };
  }

  handleError(error: any) {
    return observableThrowError({
      error: error.json(),
      code: error.status,
    });
  }

  request(method: HttpClient, path: string, options: Object, useBaseUrl?: boolean) {
    const headers = new Headers({
      'Content-Type': 'application/json',
      Authorization: `Token ${this.ws.token}`,
    });
    if (path) {
      if (!path.match(/\/$/) && !path.match(/\?/)) {
        path += '/';
      }
    }

    const requestUrl: string = (typeof (useBaseUrl) !== 'undefined' && useBaseUrl === false)
      ? path : this.baseUrl + path;

    const requestOptions: Object = {
      method,
      url: requestUrl,
      headers,
      ...options,
    };
    /* this.http.request(new Request(new RequestOptions(requestOptions))).pipe(
      map(this.handleResponse),
      catchError(this.handleError),); */
  }

  buildOptions(options) {
    const result: Object = new Object();
    const search: String[] = [];
    for (const i in options) {
      if (i == 'offset') {
        search.push(`offset(${options[i]})=`);
      } else if (i == 'sort') {
        search.push(`sort(${options[i]})=`);
      } else {
        search.push(`${i}=${options[i]}`);
      }
    }
    result['search'] = search.join('&');
    return result;
  }

  get(path: string, options: Object, useBaseUrl?: boolean) {
    /* this.request(RequestMethod.Get, path, this.buildOptions(options), useBaseUrl); */
  }

  post(path: string, options: Object, useBaseUrl?: boolean) {
    /* this.request(RequestMethod.Post, path, options, useBaseUrl); */
  }

  put(path: string, options: Object, useBaseUrl?: boolean) {
    /* this.request(RequestMethod.Put, path, options, useBaseUrl); */
  }

  delete(path: string, options: Object, useBaseUrl?: boolean) {
    /* this.request(RequestMethod.Delete, path, options, useBaseUrl); */
  }
}
