// TODO: Had issues installing @types/dygraphs. Review later.
declare module 'dygraphs' {
  export default class Dygraphs {
    constructor(...args: any[])
  }
}

declare module 'dygraphs/src/extras/smooth-plotter.js' {}
