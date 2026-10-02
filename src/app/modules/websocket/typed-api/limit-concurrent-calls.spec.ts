import { FakeConnection } from '@truenas/api-client/testing';
import { Subscription } from 'rxjs';
import { limitConcurrentCalls } from 'app/modules/websocket/typed-api/limit-concurrent-calls';

describe('limitConcurrentCalls', () => {
  let connection: FakeConnection;

  const call = (id: string): Subscription => connection.send({
    jsonrpc: '2.0', id, method: 'core.ping', params: [],
  });
  const answer = (id: string): void => connection.receive({ jsonrpc: '2.0', id, result: 'pong' });
  const sentIds = (): string[] => connection.sent.map((frame) => String(frame.id));

  beforeEach(() => {
    connection = new FakeConnection({ opened: true });
    limitConcurrentCalls(connection, 2);
  });

  afterEach(() => {
    connection.close();
  });

  it('sends calls straight away while there is room', () => {
    call('a');
    call('b');

    expect(sentIds()).toEqual(['a', 'b']);
  });

  it('holds a call back once the limit is in flight, and sends it when one is answered', () => {
    call('a');
    call('b');
    call('c');
    expect(sentIds()).toEqual(['a', 'b']);

    answer('a');

    expect(sentIds()).toEqual(['a', 'b', 'c']);
  });

  it('sends the calls it held back in the order they were made', () => {
    call('a');
    call('b');
    call('c');
    call('d');

    answer('b');
    answer('a');

    expect(sentIds()).toEqual(['a', 'b', 'c', 'd']);
  });

  it('counts an error as an answer', () => {
    call('a');
    call('b');
    call('c');

    connection.receive({ jsonrpc: '2.0', id: 'a', error: { code: -32000, message: 'refused' } });

    expect(sentIds()).toEqual(['a', 'b', 'c']);
  });

  it('never sends a held-back call whose caller has given up', () => {
    call('a');
    call('b');
    const abandoned = call('c');
    call('d');

    abandoned.unsubscribe();
    answer('a');

    expect(sentIds()).toEqual(['a', 'b', 'd']);
  });

  it('keeps a sent call counted after its caller stops listening, until it is answered', () => {
    const first = call('a');
    call('b');
    call('c');

    first.unsubscribe();
    expect(sentIds()).toEqual(['a', 'b']);

    answer('a');
    expect(sentIds()).toEqual(['a', 'b', 'c']);
  });

  it('does not count frames that are not requests', () => {
    call('a');
    call('b');

    connection.send({ jsonrpc: '2.0', method: 'core.notify' });

    expect(connection.sent).toHaveLength(3);
  });

  it('starts from nothing in flight after the socket is lost', () => {
    call('a');
    call('b');
    call('c');

    connection.simulateClose();
    connection.simulateOpen();
    call('d');
    call('e');

    // `c` was waiting when the socket went and is dropped with it.
    expect(sentIds()).toEqual(['a', 'b', 'd', 'e']);
  });

  it('frees the place of a call abandoned before a socket existed to send it on', () => {
    connection.simulateClose();
    const first = call('a');
    call('b');

    first.unsubscribe();
    call('c');
    connection.simulateOpen();

    expect(sentIds()).toEqual(['b', 'c']);
  });
});
