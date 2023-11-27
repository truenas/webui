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
  isNew?: boolean;
}

@Injectable()
export class RoutePartsService {
  private fullRouteParts: RoutePart[] | null;

  constructor(private activatedRoute: ActivatedRoute, private router: Router) {
    // only execute when routechange
    this.fullRouteParts = this.generateRouteParts(this.activatedRoute.root);
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
    ).subscribe(() => {
      this.fullRouteParts = this.generateRouteParts(this.activatedRoute.root);
    });
  }

  private generateRouteParts(route: ActivatedRoute, url = '', routeParts: RoutePart[] = []): RoutePart[] | null {
    const children: ActivatedRoute[] = route.children;
    const ngUrl: string[] = [];

    if (children.length === 0) {
      return routeParts;
    }

    // eslint-disable-next-line no-unreachable-loop
    for (const child of children) {
      const routeUrl: string = child.snapshot.url.map((segment) => segment.path).join('/');
      if (routeUrl) {
        url += `/${routeUrl}`;
        ngUrl.push(url);
      }

      const { title, breadcrumb, isNew } = child.snapshot.data as RoutePart;

      routeParts.push({
        title,
        breadcrumb,
        url,
        ngUrl,
        isNew,
      });

      return this.generateRouteParts(child, url, routeParts);
    }

    return null;
  }

  get routeParts(): RoutePart[] | null {
    return this.fullRouteParts;
  }
}
