import { bench, boxplot, do_not_optimize, run, summary } from "mitata";
import { CallbackData } from "../src/index.ts";

const schema = new CallbackData("test")
	.number("id")
	.string("name", { optional: true })
	.boolean("active")
	.enum("status", ["active", "inactive"])
	.uuid("uuid");

const first = schema.pack({
	id: 2,
	name: "test",
	active: true,
	status: "active",
	uuid: "f650d140-0321-4f85-a4db-d6b17fc96f56",
});

boxplot(() => {
	summary(() => {
		bench("schema.pack", () => {
			do_not_optimize(
				schema.pack({
					id: 2,
					name: "test",
					active: true,
					status: "active",
					uuid: "f650d140-0321-4f85-a4db-d6b17fc96f56",
				}),
			);
		});

		bench("JSON.stringify", () => {
			do_not_optimize(
				JSON.stringify({
					id: 2,
					name: "test",
					active: true,
					status: "active",
					uuid: "f650d140-0321-4f85-a4db-d6b17fc96f56",
				}),
			);
		});

		bench("schema.unpack", () => {
			do_not_optimize(schema.unpack(first));
		});
	});
});

await run();

// ! NODE
// bunx tsx .\benchmarks\index.bench.ts
// clk: ~3.83 GHz
// cpu: AMD Ryzen 7 7700 8-Core Processor
// runtime: node 22.10.0 (x64-win32)

// benchmark                   avg (min … max) p75 / p99    (min … top 1%)
// ------------------------------------------- -------------------------------
// schema.pack                    1.17 µs/iter   1.18 µs  ▄▃█
//                         (1.11 µs … 1.54 µs)   1.36 µs ▃███▇
//                     (  1.75 kb …   1.87 kb)   1.87 kb █████▆▄▃▄▅▄▂▅▃▂▄▃▁▂▂▂

// JSON.stringify               228.50 ns/iter 223.58 ns █▂
//                     (214.82 ns … 378.88 ns) 358.76 ns ██
//                     ( 61.68  b … 294.35  b) 184.23  b ██▄▂▃▂▂▁▁▁▁▁▁▁▁▁▁▁▁▁▁

// schema.unpack                  1.17 µs/iter   1.18 µs  █▃
//                         (1.13 µs … 1.33 µs)   1.30 µs ████▆▆
//                     (856.31  b …   1.69 kb)   1.08 kb ██████▆▆▆▅▅▄▁▂▂▁▄▂▂▁▃

//                              ┌                                            ┐
//                                                                 ╷┌─┬      ╷
//                  schema.pack                                    ├┤ │──────┤
//                                                                 ╵└─┴      ╵
//                              ┌┬    ╷
//               JSON.stringify ││────┤
//                              └┴    ╵
//                                                                  ┌┬┐    ╷
//                schema.unpack                                     ││├────┤
//                                                                  └┴┘    ╵
//                              └                                            ┘
//                              214.82 ns          786.39 ns           1.36 µs

// summary
//   JSON.stringify
//    5.11x faster than schema.unpack
//    5.13x faster than schema.pack

// ! BUN
// bun .\benchmarks\index.bench.ts
// clk: ~3.48 GHz
// cpu: AMD Ryzen 7 7700 8-Core Processor
// runtime: bun 1.2.6 (x64-win32)

// benchmark                   avg (min … max) p75 / p99    (min … top 1%)
// ------------------------------------------- -------------------------------
// schema.pack                    1.72 µs/iter   1.63 µs  █
//                         (1.40 µs … 3.89 µs)   3.78 µs  █▆
//                     (  0.00  b …   2.95 kb) 255.01  b ███▄▃▁▁▁▂▂▁▂▁▁▁▁▁▂▂▂▂

// JSON.stringify               135.60 ns/iter 134.84 ns   █
//                     (120.39 ns … 323.00 ns) 199.37 ns  ▂█
//                     (  0.00  b … 277.00  b)  28.11  b ▂███▄▂▂▂▂▂▃▂▂▂▁▁▁▁▁▁▁

// schema.unpack                  1.76 µs/iter   1.63 µs  █
//                         (1.47 µs … 4.27 µs)   4.09 µs  █
//                     (  0.00  b …   1.71 kb) 196.41  b ██▃▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▁▃

//                              ┌                                            ┐
//                                            ╷┌──┬                      ╷
//                  schema.pack               ├┤  │──────────────────────┤
//                                            ╵└──┴                      ╵
//                              ┬╷
//               JSON.stringify │┤
//                              ┴╵
//                                             ╷┌──┬                         ╷
//                schema.unpack                ├┤  │─────────────────────────┤
//                                             ╵└──┴                         ╵
//                              └                                            ┘
//                              120.39 ns           2.10 µs            4.09 µs

// summary
//   JSON.stringify
//    12.7x faster than schema.pack
//    12.94x faster than schema.unpack