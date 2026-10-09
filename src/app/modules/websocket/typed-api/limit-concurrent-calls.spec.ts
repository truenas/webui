import { createFakeClient, FakeConnection } from '@truenas/api-client/testing';
import { config as rxjsConfig, Subject, Subscription } from 'rxjs';
import { limitConcurrentCalls, maxGatedCalls } from 'app/modules/websocket/typed-api/limit-concurrent-calls';

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

    connection.receive({ jsonrpc: '2.0', id: 'a', error: { code: -32603, message: 'failed' } });

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
    // An answer the UI gives, should it ever: an id, and no method.
    connection.send({ jsonrpc: '2.0', id: 'theirs', result: true });

    expect(connection.sent).toHaveLength(4);
  });

  it('starts from nothing in flight after the socket is lost', () => {
    call('a');
    call('b');
    call('c');

    connection.simulateClose();
    connection.simulateOpen();
    call('d');
    call('e');

    expect(sentIds()).toEqual(['a', 'b', 'd', 'e']);

    // `c` was waiting when the socket went and is dropped with it, not sent late.
    answer('d');
    expect(sentIds()).toEqual(['a', 'b', 'd', 'e']);
  });

  it('keeps every call made before the first socket, and still holds them to the limit', () => {
    connection.close();
    connection = new FakeConnection({ opened: false });
    limitConcurrentCalls(connection, 2);
    call('a');
    call('b');
    call('c');

    connection.simulateOpen();
    expect(sentIds()).toEqual(['a', 'b']);

    answer('a');
    expect(sentIds()).toEqual(['a', 'b', 'c']);
  });

  it('keeps counting a call the connection is still holding when a socket is lost', () => {
    connection.close();
    connection = new FakeConnection({ opened: false });
    const opened$ = new Subject<boolean>();
    connection.opened$ = opened$;
    limitConcurrentCalls(connection, 2);

    // Sent as the loss is being reported, by something that heard of it first:
    // there is no socket, so the connection holds the frame for the next one.
    opened$.next(true);
    call('z');
    opened$.next(false);
    call('d');
    call('e');

    connection.simulateOpen();
    expect(sentIds()).toEqual(['z', 'd']);
  });

  it('forgets nothing when the connection reports closed without having opened', () => {
    connection.close();
    connection = new FakeConnection({ opened: false });
    const opened$ = new Subject<boolean>();
    connection.opened$ = opened$;
    limitConcurrentCalls(connection, 2);
    call('a');
    call('b');
    call('c');

    // A first attempt failing: closed, then error, with no socket in between.
    opened$.next(false);
    opened$.next(false);
    connection.simulateOpen();
    expect(sentIds()).toEqual(['a', 'b']);

    answer('a');
    expect(sentIds()).toEqual(['a', 'b', 'c']);
  });

  it('matches an answer to its call when the id comes back as a number', () => {
    call('1');
    call('2');
    call('3');

    connection.receive({ jsonrpc: '2.0', id: 1 as unknown as string, result: 'pong' });

    expect(sentIds()).toEqual(['1', '2', '3']);
  });

  it('leaves one of middleware\'s twenty places free unless told otherwise', () => {
    connection.close();
    connection = new FakeConnection({ opened: true });
    limitConcurrentCalls(connection);

    for (let index = 0; index < 25; index++) {
      call(`call-${index}`);
    }

    expect(maxGatedCalls).toBe(19);
    expect(connection.sent).toHaveLength(19);
  });

  it('holds back the calls the client makes through its own verbs', () => {
    const client = createFakeClient({ version: 'v28.0.0', authenticated: true, opened: true });
    limitConcurrentCalls(client.connection, 1);
    const sentBefore = client.connection.sent.length;

    client.api.call('core.ping').subscribe();
    client.api.call('system.info').subscribe();
    expect(client.connection.sent.slice(sentBefore).map((frame) => frame.method)).toEqual(['core.ping']);

    client.connection.reply('core.ping', 'pong');
    expect(client.connection.sent.slice(sentBefore).map((frame) => frame.method)).toEqual(['core.ping', 'system.info']);

    client.close();
  });

  it('gives back the place of a held-back call that could not be sent, and carries on', () => {
    connection.close();
    connection = new FakeConnection({ opened: true });
    const send = connection.send.bind(connection);
    connection.send = (message) => {
      if (message.id === 'broken') {
        throw new Error('cannot send');
      }
      return send(message);
    };
    limitConcurrentCalls(connection, 1);
    // `broken` is started by the answer to `a`, so that is where it throws: inside
    // the gate's own subscriber, which RxJS reports rather than rethrows.
    const reported = jest.fn();
    rxjsConfig.onUnhandledError = reported;
    jest.useFakeTimers();

    call('a');
    call('broken');
    call('c');
    answer('a');
    jest.runAllTimers();
    answer('c');
    call('d');

    expect(reported).toHaveBeenCalledWith(new Error('cannot send'));
    expect(sentIds()).toEqual(['a', 'c', 'd']);

    jest.useRealTimers();
    rxjsConfig.onUnhandledError = null;
  });

  it('says so when middleware refuses a call for being one too many', () => {
    jest.spyOn(console, 'error').mockImplementation();
    call('a');

    connection.receive({
      jsonrpc: '2.0', id: 'a', error: { code: -32000, message: 'Maximum number of concurrent calls (20) has exceeded' },
    });

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('refused a call'));
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
