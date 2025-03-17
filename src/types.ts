export type Prettify<T> = { [Key in keyof T]: T[Key] } & {};

type AllowedTypes = "string" | "number" | "boolean" | "enum" | "uuid";

export interface FieldTypeToTsType<Enum extends unknown[]> {
	string: string;
	number: number;
	boolean: boolean;
	enum: Enum;
	uuid: string;
}

export type AddFieldOutput<
	T extends AllowedTypes,
	Key extends string,
	Optional extends boolean = false,
	Enum extends unknown[] = never,
	Default extends FieldTypeToTsType<Enum>[T] = never,
> = [Default] extends [never]
	? Optional extends true
		? { [K in Key]?: FieldTypeToTsType<Enum>[T] }
		: { [K in Key]: FieldTypeToTsType<Enum>[T] }
	: { [K in Key]: FieldTypeToTsType<Enum>[T] };

export type AddFieldInput<
	T extends AllowedTypes,
	Key extends string,
	Optional extends boolean = false,
	Enum extends unknown[] = never,
	Default extends FieldTypeToTsType<Enum>[T] = never,
> = [Default] extends [never]
	? Optional extends true
		? { [K in Key]?: FieldTypeToTsType<Enum>[T] }
		: { [K in Key]: FieldTypeToTsType<Enum>[T] }
	: { [K in Key]?: FieldTypeToTsType<Enum>[T] };

export type EnumField<T extends unknown[]> = {
	enumValues: T;
};

export interface FieldOptions<
	T extends AllowedTypes,
	Optional extends boolean = false,
	Enum extends unknown[] = never,
	Default extends FieldTypeToTsType<Enum>[T] = never,
> {
	optional?: [Default] extends [never] ? Optional : true;
	default?: Default;
}

export interface Field<Optional extends boolean = false>
	extends FieldOptions<AllowedTypes, Optional, unknown[]> {
	type: AllowedTypes;
}

export type Schema = {
	required: {
		key: string;
		type: AllowedTypes;
		enumValues?: string[];
	}[];
	optional: {
		key: string;
		type: AllowedTypes;
		enumValues?: string[];
		default?: any;
	}[];
};
