export interface StaticRoute {
  description: string;
  destination: string;
  gateway: string;
  id: number;
}

export type UpdateStaticRoute = Omit<StaticRoute, 'id'>;
