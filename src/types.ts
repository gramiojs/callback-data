export type Prettify<T> = { [Key in keyof T]: T[Key] } & {};

export type AddField<
	T extends string | number | boolean,
	Key extends string,
> = {
	[K in Key]: T;
};

export interface FieldOptions<T extends string | number | boolean> {
	optional?: boolean;
	default?: T;
}
