export type Prettify<T> = { [Key in keyof T]: T[Key] } & {};

type AllowedTypes = "string" | "number" | "boolean" | "enum";

export interface FieldTypeToTsType<Enum extends unknown[]> {
	string: string;
	number: number;
	boolean: boolean;
	enum: Enum;
}

export type AddField<
	T extends AllowedTypes,
	Key extends string,
	Optional extends boolean = false,
	Enum extends unknown[] = never,
> = Optional extends true
	? { [K in Key]?: FieldTypeToTsType<Enum>[T] }
	: { [K in Key]: FieldTypeToTsType<Enum>[T] };

export type EnumField<T extends unknown[]> = {
	enumValues: T;
};

export interface FieldOptions<
	T extends AllowedTypes,
	Optional extends boolean = false,
	Enum extends unknown[] = never,
> {
	optional?: Optional;
	// default?: FieldTypeToTsType<Enum>;
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
	}[];
};
