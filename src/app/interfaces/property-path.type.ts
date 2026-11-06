/**
 * Dot paths into `T`, e.g. `'name'`, `'address'`, `'address.line1'`. Limited to 3 levels because some
 * of our interfaces are recursive.
 */
export type PropertyPath<T, Depth extends number = 3>
  = Depth extends 0 ? never
    : T extends object ? {
      [K in keyof T]-?: K extends string | number
        ? `${K}` | Join<K, PropertyPath<T[K], Prev[Depth]>>
        : never
    }[keyof T] : '';

type Prev = [never, 0, 1, 2, 3, ...0[]];

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? `${K}${'' extends P ? '' : '.'}${P}`
    : never : never;
