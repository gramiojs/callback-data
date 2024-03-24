export type Prettify<T> = { [Key in keyof T]: T[Key] } & {};

type AllowedTypes = string | number | boolean;

export type AddField<T extends AllowedTypes, Key extends string> = {
	[K in Key]: T;
};

export interface FieldOptions<T extends AllowedTypes> {
	optional?: boolean;
	default?: T;
}

export interface Field extends FieldOptions<AllowedTypes> {
	type: AllowedTypes;
}
