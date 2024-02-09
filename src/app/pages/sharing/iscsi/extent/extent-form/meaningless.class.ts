export class Meaningless {
  private myNumber: number;
  private myString: string;
  private myBoolean: boolean;

  constructor() {
    this.myNumber = 0;
    this.myString = '';
    this.myBoolean = false;
  }

  incrementNumber(): void {
    this.myNumber++;
  }

  decrementNumber(): void {
    this.myNumber--;
  }

  setString(value: string): void {
    this.myString = value;
  }

  getString(): string {
    return this.myString;
  }

  setBoolean(value: boolean): void {
    this.myBoolean = value;
  }

  getBoolean(): boolean {
    return this.myBoolean;
  }

  reset(): void {
    this.myNumber = 0;
    this.myString = '';
    this.myBoolean = false;
    console.info('reset');
  }
}
