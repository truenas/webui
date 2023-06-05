import { Injectable } from '@angular/core';
import {
  ActivatedRoute, NavigationEnd, Router,
} from '@angular/router';
import { filter } from 'rxjs/operators';

export interface RoutePart {
  title: string;
  breadcrumb: string;
  url: string;
  ngUrl?: string[];
  disabled?: boolean;
}

@Injectable()
export class RoutePartsService {
  private fullRouteParts: RoutePart[];

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    // only execute when routechange
    this.fullRouteParts = this.generateRouteParts(this.activatedRoute.root);
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
    ).subscribe(() => {
      this.fullRouteParts = this.generateRouteParts(this.activatedRoute.root);
    });
  }

  private generateRouteParts(route: ActivatedRoute, url = '', routeParts: RoutePart[] = []): RoutePart[] {
    const children: ActivatedRoute[] = route.children;
    const ngUrl: string[] = [url];

    if (children.length === 0) {
      return routeParts;
    }

    for (const child of children) {
      const routeUrl: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeUrl) {
        url += `/${routeUrl}`;
        ngUrl.push(url);
      }

      const { title, breadcrumb, disabled } = child.snapshot.data as {
        title: string;
        breadcrumb: string;
        disabled: boolean;
      };
      if (title) {
        routeParts.push({
          title,
          breadcrumb,
          disabled,
          url,
          ngUrl,
        });
      }

      return this.generateRouteParts(child, url, routeParts);
    }

    return undefined;
  }

  get routeParts(): RoutePart[] {
    return this.fullRouteParts;
  }
}
