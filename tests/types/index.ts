import { expectTypeOf } from "expect-type";
import { CallbackData } from "../../src/index.ts";

const callbackDataString = new CallbackData("test").string("name", {
	optional: true,
});

expectTypeOf(callbackDataString.pack)
	.parameter(0)
	.toEqualTypeOf<{ name?: string } | undefined>();
expectTypeOf(callbackDataString.pack).returns.toBeString();

const callbackDataNumber = new CallbackData("test").number("age", {
	default: 30,
});

expectTypeOf(callbackDataNumber.pack)
	.parameter(0)
	.toEqualTypeOf<{ age?: number } | undefined>();
expectTypeOf(callbackDataNumber.pack).returns.toBeString();

const callbackDataBoolean = new CallbackData("test").boolean("isActive", {
	optional: true,
});

expectTypeOf(callbackDataBoolean.pack)
	.parameter(0)
	.toEqualTypeOf<{ isActive?: boolean } | undefined>();
expectTypeOf(callbackDataBoolean.pack).returns.toBeString();

const callbackDataEnum = new CallbackData("test").enum(
	"status",
	["active", "inactive"],
	{
		default: "active",
	},
);

expectTypeOf(callbackDataEnum.pack)
	.parameter(0)
	.toEqualTypeOf<{ status?: "active" | "inactive" } | undefined>();
expectTypeOf(callbackDataEnum.pack).returns.toBeString();

const callbackDataUuid = new CallbackData("test").uuid("userId", {
	optional: true,
});

expectTypeOf(callbackDataUuid.pack)
	.parameter(0)
	.toEqualTypeOf<{ userId?: string } | undefined>();
expectTypeOf(callbackDataUuid.pack).returns.toBeString();

const callbackDataWithDefaults = new CallbackData("test").boolean("flag", {
	default: true,
});

expectTypeOf(callbackDataWithDefaults.pack)
	.parameter(0)
	.toEqualTypeOf<{ flag?: boolean } | undefined>();
expectTypeOf(callbackDataWithDefaults.pack).returns.toBeString();

const unpackedData = callbackDataWithDefaults.unpack(
	callbackDataWithDefaults.pack({ flag: true }),
);
expectTypeOf(unpackedData).toEqualTypeOf<{ flag: boolean }>();

const requiredCallbackData = new CallbackData("test")
	.string("name")
	.number("age");

expectTypeOf(requiredCallbackData.pack)
	.parameter(0)
	.toEqualTypeOf<{ name: string; age: number }>();
expectTypeOf(requiredCallbackData.pack).returns.toBeString();

const requiredUnpackedData = requiredCallbackData.unpack(
	requiredCallbackData.pack({ name: "John", age: 25 }),
);
expectTypeOf(requiredUnpackedData).toEqualTypeOf<{
	name: string;
	age: number;
}>();

const optionalCallbackData = new CallbackData("test")
	.string("name", { optional: true })
	.number("age", { optional: true });

expectTypeOf(optionalCallbackData.pack)
	.parameter(0)
	.toEqualTypeOf<{ name?: string; age?: number } | undefined>();
expectTypeOf(optionalCallbackData.pack).returns.toBeString();

const optionalUnpackedData = optionalCallbackData.unpack(
	optionalCallbackData.pack({ name: "John" }),
);
expectTypeOf(optionalUnpackedData).toEqualTypeOf<{
	name?: string;
	age?: number;
}>();

const defaultCallbackData = new CallbackData("test").boolean("isActive", {
	default: true,
});

expectTypeOf(defaultCallbackData.pack)
	.parameter(0)
	.toEqualTypeOf<{ isActive?: boolean } | undefined>();
expectTypeOf(defaultCallbackData.pack).returns.toBeString();

const defaultUnpackedData = defaultCallbackData.unpack(
	defaultCallbackData.pack({ isActive: false }),
);
expectTypeOf(defaultUnpackedData).toEqualTypeOf<{ isActive: boolean }>();

const defaultUnpackedDataWithDefaults = defaultCallbackData.unpack(
	defaultCallbackData.pack(),
);
expectTypeOf(defaultUnpackedDataWithDefaults).toEqualTypeOf<{
	isActive: boolean;
}>();
