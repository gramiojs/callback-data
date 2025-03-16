import { expect, test, describe, beforeEach } from 'bun:test';
import { CompactSerializer } from '../src/serialization';
import type { Schema } from '../src/types';
import { getBytesLength } from './utils';

describe('CompactSerializer', () => {
  const testSchema: Schema = {
    required: [
      { key: 'id', type: 'number' },
      { key: 'type', type: 'enum', enumValues: ['user', 'admin'] }
    ],
    optional: [
      { key: 'name', type: 'string' },
      { key: 'status', type: 'enum', enumValues: ['active', 'inactive'] }
    ]
  };

  test('basic serialization/deserialization', () => {
    const obj = {
      id: 42,
      type: 'admin',
      name: 'Alice',
      status: 'active'
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);
    
    expect(getBytesLength(serialized)).toMatchInlineSnapshot(`17`);
    expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`57`);
    
    expect(deserialized).toEqual(obj);
  });

  test('missing optional fields', () => {
    const obj = {
      id: 42,
      type: 'user' 
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);

    expect(getBytesLength(serialized)).toMatchInlineSnapshot(`7`);
    expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`23`);
    
    expect(deserialized).toEqual({
      id: 42,
      type: 'user'
    });
  });

  test('string escaping', () => {
    const obj = {
      id: 42,
      type: 'user',
      name: 'Contains;semicolon'
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);

    expect(getBytesLength(serialized)).toMatchInlineSnapshot(`32`);
    expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`51`);
    
    expect(deserialized.name).toBe('Contains;semicolon');
  });

  test('number boundaries', () => {
    const obj = {
      id: Number.MAX_SAFE_INTEGER,
      type: 'admin'
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);

    expect(getBytesLength(serialized)).toMatchInlineSnapshot(`16`);
    expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`38`);
    
    expect(deserialized.id).toBe(Number.MAX_SAFE_INTEGER);
  });
  test('number 1', () => {
    const obj = {
      id: 1,
      type: 'admin'
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);

    expect(getBytesLength(serialized)).toMatchInlineSnapshot(`6`);
    expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`23`);
    
    expect(deserialized.id).toBe(1);
  });

  test('handles cyrillic characters', () => {
    const obj = {
      id: 42,
      type: 'user',
      name: 'Анна Каренина;Тест'
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    console.log(serialized, getBytesLength(serialized));
    
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);
    console.log(deserialized, getBytesLength(deserialized));

    expect(getBytesLength(serialized)).toMatchInlineSnapshot(`54`);
    expect(getBytesLength(deserialized)).toMatchInlineSnapshot(`67`);


    expect(deserialized.name).toBe('Анна Каренина;Тест');

    expect(getBytesLength(serialized)).toBeLessThan(getBytesLength(obj));
  });

  test('boolean serialization', () => {
    const schema = { 
        required: [{ key: 'flag'  as const, type: 'boolean' as const }],
        optional: [] 
    };
    
    const serialized = CompactSerializer.serialize(schema, { flag: true });
    expect(serialized).toMatch(/;1$/);
    
    const deserialized = CompactSerializer.deserialize(schema, serialized);
    expect(deserialized.flag).toBe(true);
}); 
});