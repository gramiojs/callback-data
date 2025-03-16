import { expect, test, describe, beforeEach } from 'bun:test';
import { CompactSerializer, Schema } from '../src/serialization';

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
    
    expect(serialized.length).toMatchInlineSnapshot(`17`);
    expect(JSON.stringify(obj).length).toMatchInlineSnapshot(`57`);
    
    expect(deserialized).toEqual(obj);
  });

  test('missing optional fields', () => {
    const obj = {
      id: 42,
      type: 'user' 
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);
    expect(serialized.length).toMatchInlineSnapshot(`7`);
    expect(JSON.stringify(obj).length).toMatchInlineSnapshot(`23`);
    
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
    expect(serialized.length).toMatchInlineSnapshot(`32`);
    expect(JSON.stringify(obj).length).toMatchInlineSnapshot(`51`);
    
    expect(deserialized.name).toBe('Contains;semicolon');
  });

  test('number boundaries', () => {
    const obj = {
      id: Number.MAX_SAFE_INTEGER,
      type: 'admin'
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);
    expect(serialized.length).toMatchInlineSnapshot(`16`);
    expect(JSON.stringify(obj).length).toMatchInlineSnapshot(`38`);
    
    expect(deserialized.id).toBe(Number.MAX_SAFE_INTEGER);
  });

  test('handles cyrillic characters', () => {
    const obj = {
      id: 42,
      type: 'user',
      name: 'Анна Каренина;Тест'
    };

    const serialized = CompactSerializer.serialize(testSchema, obj);
    console.log(serialized, serialized.length);
    expect(serialized.length).toMatchInlineSnapshot(`54`);
    const deserialized = CompactSerializer.deserialize(testSchema, serialized);
    console.log(deserialized, JSON.stringify(deserialized).length);
    expect(JSON.stringify(deserialized).length).toMatchInlineSnapshot(`51`);
    expect(deserialized.name).toBe('Анна Каренина;Тест');

    expect(serialized.length).toBeLessThan(JSON.stringify(obj).length);
  });
});