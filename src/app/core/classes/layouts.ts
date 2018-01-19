export interface LayoutContainer {
  layout:string;
  align: string;
  gap:string;
}

export interface LayoutChild {
  flex: string;
  order?: string;
  offset?: string;
  align?: string;
  fill?: boolean;
}
