/**
 * E.g. given User interface:
 * {
 *  name: string;
 *   address: {
 *     line1: string;
 *   }
 * }
 *
 * PropertyPath<User> will allow
 * 'name'
 * 'address'
 * 'address.line1'
 *
 * It only supports up to 3 levels of nesting because some of our interfaces have recursion and this creates problems.
 */
export type PropertyPath<T, Depth extends number = 3> =
  Depth extends 0 ? never :
    T extends object ? {
      [K in keyof T]-?: K extends string | number ?
        `${K}` | Join<K, PropertyPath<T[K], Prev[Depth]>>
        : never
    }[keyof T] : '';

type Prev = [never, 0, 1, 2, 3, ...0[]];

type Join<K, P> = K extends string | number ?
  P extends string | number ?
    `${K}${'' extends P ? '' : '.'}${P}`
    : never : never;
