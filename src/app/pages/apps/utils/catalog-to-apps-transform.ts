import {
  map, Observable, pipe, UnaryFunction,
} from 'rxjs';
import { Catalog, CatalogApp } from 'app/interfaces/catalog.interface';

export const catalogToAppsTransform = (): UnaryFunction<Observable<Catalog[]>, Observable<CatalogApp[]>> => pipe(
  map((catalogs: Catalog[]) => {
    const apps: CatalogApp[] = [];

    catalogs.forEach((catalog) => {
      Object.entries(catalog.trains).forEach(([train, trainCatalog]) => {
        Object.values(trainCatalog).forEach((item) => {
          apps.push({
            ...item,
            catalog: {
              id: catalog.id,
              train,
              label: catalog.label,
            },
          });
        });
      });
    });

    return apps;
  }),
);
