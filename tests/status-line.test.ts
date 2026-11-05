import { describe, expect, it } from 'vitest';
import { parseVisited, statusLine, VISITED_KEY } from '../src/lib/status-line';

describe('the status line', () => {
  const ids = ['horde-hours', 'push-comes-to-shove', 'station', 'lab'];

  it('reads the clock and the phase the map is lit at', () => {
    expect(statusLine(13.72, [], ids)).toMatchObject({ time: '13:43', phase: 'Day' });
    expect(statusLine(2, [], ids)).toMatchObject({ time: '02:00', phase: 'Night' });
    expect(statusLine(17.5, [], ids).phase).toBe('Golden hour');
  });

  it('counts each existing place once', () => {
    expect(statusLine(12, [], ids).explored).toBe('0/4 explored');
    expect(statusLine(12, ['lab', 'lab', 'station'], ids).explored).toBe('2/4 explored');
    // A Dev Mode test project or a deleted project in the stored list does not count.
    expect(statusLine(12, ['test-project', 'gone', 'lab'], ids).explored).toBe('1/4 explored');
  });

  it('reads the map\'s stored list and survives anything else in the key', () => {
    expect(VISITED_KEY).toBe('portfolio-world-visited');
    expect(parseVisited('["lab","station"]')).toEqual(['lab', 'station']);
    expect(parseVisited(null)).toEqual([]);
    expect(parseVisited('not json')).toEqual([]);
    expect(parseVisited('{"lab":true}')).toEqual([]);
    expect(parseVisited('["lab",3,null]')).toEqual(['lab']);
  });
});
