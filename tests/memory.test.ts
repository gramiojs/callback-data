import { CallbackData } from "../src";
import { expect, test } from "bun:test";
import { compareMemoryUsage } from "./utils";

const callbackData = new CallbackData('test')
    .number('secret');

test.skipIf(!process.argv.includes('--memory'))('memory safety', async () => {    
    const bufBefore = process.memoryUsage()
    for (let i = 0; i < 1e6; i++) {
        callbackData.pack({ secret: Math.random() });
    }
    const bufAfter = process.memoryUsage();
    
    console.log(bufBefore, bufAfter);
    console.log(bufAfter.arrayBuffers - bufBefore.arrayBuffers);
    console.log(compareMemoryUsage(bufBefore, bufAfter));
    expect(bufAfter.arrayBuffers - bufBefore.arrayBuffers).toBeLessThan(10 * 1024 * 1024); // <10MB

    await Bun.sleep(3000);

    const bufAfter2 = process.memoryUsage();
    console.log(compareMemoryUsage(bufBefore, bufAfter2));
}); 