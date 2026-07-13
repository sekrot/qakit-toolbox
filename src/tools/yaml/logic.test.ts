import { describe, expect, it } from 'vitest';
import { jsonToYaml } from './logic';

function yaml(input: string, indent?: number): string {
  const result = jsonToYaml(input, indent);
  if (!result.ok) throw new Error(`expected ok, got error: ${result.error}`);
  return result.output!;
}

describe('jsonToYaml — errors', () => {
  it('fails on empty input', () => {
    expect(jsonToYaml('')).toEqual({ ok: false, error: 'Input is empty' });
    expect(jsonToYaml('   ')).toEqual({ ok: false, error: 'Input is empty' });
  });

  it('fails on invalid JSON with a message', () => {
    const result = jsonToYaml('{invalid');
    expect(result.ok).toBe(false);
    expect(result.error).toBeTruthy();
  });
});

describe('jsonToYaml — scalars', () => {
  it('renders a top-level string', () => {
    expect(yaml('"hello"')).toBe('hello\n');
  });
  it('renders a top-level number', () => {
    expect(yaml('42')).toBe('42\n');
  });
  it('renders top-level true/false/null', () => {
    expect(yaml('true')).toBe('true\n');
    expect(yaml('false')).toBe('false\n');
    expect(yaml('null')).toBe('null\n');
  });
});

describe('jsonToYaml — objects', () => {
  it('renders a flat object as key: value pairs', () => {
    expect(yaml('{"a":1,"b":"two","c":true,"d":null}')).toBe('a: 1\nb: two\nc: true\nd: null\n');
  });

  it('renders an empty object as {}', () => {
    expect(yaml('{}')).toBe('{}\n');
  });

  it('renders an empty object value inline under a key', () => {
    expect(yaml('{"a":{}}')).toBe('a: {}\n');
  });

  it('renders nested objects with 2-space indent by default', () => {
    expect(yaml('{"a":{"b":{"c":1}}}')).toBe('a:\n  b:\n    c: 1\n');
  });

  it('honours a custom indent size', () => {
    expect(yaml('{"a":{"b":1}}', 4)).toBe('a:\n    b: 1\n');
  });

  it('preserves key insertion order', () => {
    expect(yaml('{"z":1,"a":2}')).toBe('z: 1\na: 2\n');
  });
});

describe('jsonToYaml — arrays', () => {
  it('renders a flat array as a block sequence', () => {
    expect(yaml('[1,2,3]')).toBe('- 1\n- 2\n- 3\n');
  });

  it('renders an empty array as []', () => {
    expect(yaml('[]')).toBe('[]\n');
  });

  it('renders an empty array value inline under a key', () => {
    expect(yaml('{"a":[]}')).toBe('a: []\n');
  });

  it('renders an array of objects with keys aligned under the dash', () => {
    expect(yaml('[{"a":1,"b":2},{"a":3,"b":4}]')).toBe('- a: 1\n  b: 2\n- a: 3\n  b: 4\n');
  });

  it('renders a nested array under a key, indented one level', () => {
    expect(yaml('{"list":[1,2]}')).toBe('list:\n  - 1\n  - 2\n');
  });

  it('renders an array of arrays', () => {
    expect(yaml('[[1,2],[3,4]]')).toBe('- - 1\n  - 2\n- - 3\n  - 4\n');
  });
});

describe('jsonToYaml — string quoting', () => {
  it('leaves plain safe strings unquoted', () => {
    expect(yaml('{"a":"hello world"}')).toBe('a: hello world\n');
  });

  it('quotes the empty string', () => {
    expect(yaml('{"a":""}')).toBe('a: ""\n');
  });

  it('quotes strings that look like booleans or null', () => {
    expect(yaml('{"a":"true","b":"false","c":"null","d":"yes","e":"no"}')).toBe(
      'a: "true"\nb: "false"\nc: "null"\nd: "yes"\ne: "no"\n',
    );
  });

  it('quotes strings that look like numbers', () => {
    expect(yaml('{"a":"42","b":"-3.14","c":"1e10"}')).toBe('a: "42"\nb: "-3.14"\nc: "1e10"\n');
  });

  it('quotes strings that look like dates', () => {
    expect(yaml('{"a":"2024-01-01"}')).toBe('a: "2024-01-01"\n');
  });

  it('quotes strings starting with special YAML indicator characters', () => {
    expect(yaml('{"a":"- dash","b":"#hash","c":"[bracket]"}')).toBe(
      'a: "- dash"\nb: "#hash"\nc: "[bracket]"\n',
    );
  });

  it('quotes strings containing ": " or ending with ":"', () => {
    expect(yaml('{"a":"key: value","b":"trailing:"}')).toBe('a: "key: value"\nb: "trailing:"\n');
  });

  it('quotes strings with leading/trailing whitespace', () => {
    expect(yaml('{"a":" padded "}')).toBe('a: " padded "\n');
  });

  it('properly escapes newlines, tabs, and quotes inside quoted strings', () => {
    expect(yaml('{"a":"line1\\nline2\\t\\"quoted\\""}')).toBe(
      'a: "line1\\nline2\\t\\"quoted\\""\n',
    );
  });

  it('quotes an object key when it looks ambiguous', () => {
    // Integer-like keys are always enumerated first by JS, ahead of insertion order.
    expect(yaml('{"true":1,"123":2}')).toBe('"123": 2\n"true": 1\n');
  });
});

describe('jsonToYaml — mixed nesting (regression)', () => {
  it('renders a realistic mixed document', () => {
    const input = JSON.stringify({
      name: 'QAKit',
      version: 1,
      active: true,
      tags: ['qa', 'dev'],
      owner: { name: 'Alice', admin: true },
      history: [],
      meta: {},
    });
    expect(yaml(input)).toBe(
      [
        'name: QAKit',
        'version: 1',
        'active: true',
        'tags:',
        '  - qa',
        '  - dev',
        'owner:',
        '  name: Alice',
        '  admin: true',
        'history: []',
        'meta: {}',
        '',
      ].join('\n'),
    );
  });
});
