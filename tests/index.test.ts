import { describe, test, expect, beforeEach } from 'bun:test';
import { CallbackData } from '../src/index';

describe('CallbackData', () => {
  let builder: CallbackData;

  beforeEach(() => {
    builder = new CallbackData('test');
  });

  test('should create instance with hashed id', () => {
    expect(builder.id).toMatch(/^[a-f0-9]{6}$/);
  });

  test('should build schema with required fields', () => {
    const schema = builder
      .string('name')
      .number('age')
      .boolean('isActive')
      .enum('role', ['admin', 'user']);

    expect(schema).toBeInstanceOf(CallbackData);
  });

  test('should handle optional fields with defaults', () => {
    const schema = builder
      .string('optionalString', { optional: true, }) // default: 'default' 
      .number('optionalNumber', { optional: true })
      .boolean('optionalBoolean', { optional: true });

    expect(schema).toBeInstanceOf(CallbackData);
  });

  test('pack/unpack should serialize/deserialize correctly', () => {
    const testData = { id: 42, name: 'Test' };
    const schema = new CallbackData('test').number('id').string('name');
    
    const packed = schema.pack(testData);
    const unpacked = schema.unpack(packed);

    expect(packed.startsWith(schema.id)).toBeTrue();
    expect(unpacked).toEqual({
      id: 42,
      name: 'Test'
    });
  });

  test('regexp should match packed format', () => {
    const testData = { value: 1 };
    const schema = new CallbackData('test').number('value');
    const packed = schema.pack(testData);
    
    expect(schema.regexp().test(packed)).toBeTrue();
  });

  test('unpack should throw on invalid id', () => {
    const schema = new CallbackData('test');
    const invalidData = 'wrong|{"value":1}';
    
    expect(() => schema.unpack(invalidData)).toThrow('id mismatch');
  });
});

describe('Serialization/Deserialization', () => {
  test('should handle all field types', () => {
    const schema = new CallbackData('full')
      .string('name')
      .number('age')
      .boolean('isAdmin')
      .enum('role', ['user', 'moderator', 'admin'], { optional: true });

    const testData = {
      name: 'Alice',
      age: 30,
      isAdmin: true,
      role: 'admin' as const
    };

    const packed = schema.pack(testData);
    const unpacked = schema.unpack(packed);
    
    expect(unpacked).toEqual(testData);
  });

  test('should handle special characters in strings', () => {
    const schema = new CallbackData('special').string('text');
    const testData = { text: 'Hello|World\\nTest;Escaped' };
    
    const packed = schema.pack(testData);
    const unpacked = schema.unpack(packed);
    
    expect(unpacked?.text).toBe(testData.text);
  });

  test('should handle number boundaries', () => {
    const schema = new CallbackData('numbers').number('max');
    const testData = { max: Number.MAX_SAFE_INTEGER };
    
    const packed = schema.pack(testData);
    const unpacked = schema.unpack(packed);
    
    expect(unpacked?.max).toBe(testData.max);
  });

  test('should handle boolean values', () => {
    const schema = new CallbackData('bools')
      .boolean('flag1')
      .boolean('flag2');

    const testData = { flag1: true, flag2: false };
    const unpacked = schema.unpack(schema.pack(testData));
    
    expect(unpacked?.flag1).toBe(true);
    expect(unpacked?.flag2).toBe(false);
  });

//   test('should apply default values for optional fields', () => {
//     const schema = new CallbackData('defaults')
//       .string('name', { optional: true }) // default: 'Anonymous'
//       .number('count', { optional: true }); // default: 0

//     const packed = schema.pack({});
//     const unpacked = schema.unpack(packed);
    
//     expect(unpacked.name).toBe('Anonymous');
//     expect(unpacked.count).toBe(0);
//   });

  test('should validate enum values', () => {
    const schema = new CallbackData('enums')
      .enum('status', ['active', 'inactive']);

    const testData = { status: 'active' as const };
    const packed = schema.pack(testData);
    console.log(packed);
    const unpacked = schema.unpack(packed);
    
    console.log(unpacked);
    expect(unpacked?.status).toBe('active');
  });

  test('should handle empty optional fields', () => {
    const schema = new CallbackData('optional')
      .string('comment', { optional: true })
      .number('rating', { optional: true });

    const testData = { /* empty */ };
    const unpacked = schema.unpack(schema.pack(testData));
    
    expect(unpacked).toEqual({});
  });
});
