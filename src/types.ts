import type { CallbackData } from "./index.ts";

export type Prettify<T> = { [Key in keyof T]: T[Key] } & {};

type AllowedTypes = "string" | "number" | "boolean" | "enum" | "uuid" | "data";

export interface FieldTypeToTsType<
	Enum extends unknown[] | readonly unknown[],
	Data extends CallbackData = never,
> {
	string: string;
	number: number;
	boolean: boolean;
	enum: Enum;
	uuid: string;
	data: InferDataPack<Data>;
}

export type AddFieldOutput<
	T extends AllowedTypes,
	Key extends string,
	Optional extends boolean = false,
	Enum extends unknown[] = never,
	Default extends FieldTypeToTsType<Enum, Data>[T] = never,
	Data extends CallbackData = never,
> = [Default] extends [never]
	? Optional extends true
		? { [K in Key]?: FieldTypeToTsType<Enum, Data>[T] }
		: { [K in Key]: FieldTypeToTsType<Enum, Data>[T] }
	: { [K in Key]: FieldTypeToTsType<Enum, Data>[T] };

export type AddFieldInput<
	T extends AllowedTypes,
	Key extends string,
	Optional extends boolean = false,
	Enum extends unknown[] = never,
	Default extends FieldTypeToTsType<Enum, Data>[T] = never,
	Data extends CallbackData = never,
> = [Default] extends [never]
	? Optional extends true
		? { [K in Key]?: FieldTypeToTsType<Enum, Data>[T] }
		: { [K in Key]: FieldTypeToTsType<Enum, Data>[T] }
	: { [K in Key]?: FieldTypeToTsType<Enum, Data>[T] };

export type EnumField<T extends unknown[]> = {
	enumValues: T;
};

export interface FieldOptions<
	T extends AllowedTypes,
	Optional extends boolean = false,
	Enum extends unknown[] | readonly unknown[] = never,
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
		enumValues?: string[] | readonly string[];
		data?: CallbackData;
	}[];
	optional: {
		key: string;
		type: AllowedTypes;
		enumValues?: string[] | readonly string[];
		data?: CallbackData;
		default?: any;
	}[];
};

export type IsOptionalType<T> = {
	[K in keyof T]-?: undefined extends T[K] ? true : false;
}[keyof T] extends true
	? true
	: false;

export type InferDataPack<T extends CallbackData> = T extends CallbackData<
	infer SchemaType,
	infer SchemaTypeInput
>
	? SchemaTypeInput
	: never;
export type InferDataUnpack<T extends CallbackData> = T extends CallbackData<
	infer SchemaType,
	infer SchemaTypeInput
>
	? SchemaType
	: never;
