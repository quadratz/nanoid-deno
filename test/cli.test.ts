import { assertMatch, assertStrictEquals } from "jsr:@std/assert@0.226";
import denoJson from "../deno.json" with { type: "json" };

async function nanoidCli(arg: string = "") {
  const args = arg.length > 0 ? arg.split(" ") : [];
  const command = new Deno.Command(Deno.execPath(), {
    cwd: import.meta.dirname,
    args: ["run", "../cli.ts", ...args],
  });
  const result = await command.output();
  const { success, stderr, stdout } = result;
  return {
    success,
    stderr: new TextDecoder().decode(stderr),
    stdout: new TextDecoder().decode(stdout),
  };
}

Deno.test("CLI", async (t) => {
  await t.step("prints unique ID", async () => {
    const result = await nanoidCli();
    const { stdout, success } = result;
    assertMatch(stdout, /^[\w-]{21}\n$/);
    assertStrictEquals(success, true);
  });

  await t.step("uses size", async () => {
    const result = await nanoidCli("--size 10");
    const { stdout, success } = result;
    assertMatch(stdout, /^[\w-]{10}\n$/);
    assertStrictEquals(success, true);

    const result2 = await nanoidCli("--s 10");
    const { stdout: shortcut } = result2;
    assertMatch(shortcut, /^[\w-]{10}\n$/);
  });

  await t.step("uses alphabet", async () => {
    const result = await nanoidCli("--alphabet abc --size 15");
    const { stdout, success } = result;
    assertMatch(stdout, /^[abc]{15}\n$/);
    assertStrictEquals(success, true);

    const result2 = await nanoidCli("-a abc -s 15");
    const { stdout: shortcut } = result2;
    assertMatch(shortcut, /^[\w-]{15}\n$/);
  });

  await t.step("shows an error on unknown argument", async () => {
    const result = await nanoidCli("--cook");
    const { success, stderr } = result;
    assertStrictEquals(success, false);
    assertMatch(stderr, /.*unexpected argument '--cook'.*/);
  });

  await t.step("shows an error if size is not a number", async () => {
    const result = await nanoidCli("-s abc");
    const { success, stderr } = result;
    assertStrictEquals(success, false);
    assertMatch(stderr, /Invalid size: 'abc'. Please provide a valid number/);
  });

  await t.step("shows an error if size is a negative number", async () => {
    const result = await nanoidCli("-s=-1");
    const { success, stderr } = result;
    assertStrictEquals(success, false);
    assertMatch(stderr, /Invalid size: '-1'. Please provide a positive number/);
  });

  await t.step("displays help", async () => {
    const result = await nanoidCli("--help");
    const { stdout, success } = result;
    assertMatch(stdout, /Show this help/);
    assertStrictEquals(success, true);

    const result2 = await nanoidCli("-h");
    const { stdout: shortcut } = result2;
    assertMatch(shortcut, /Show this help/);
  });

  await t.step("displays the correct version", async () => {
    const re = new RegExp(denoJson.version);
    const result = await nanoidCli("--version");
    const { stdout, success } = result;
    assertMatch(stdout, re);
    assertStrictEquals(success, true);

    const result2 = await nanoidCli("-V");
    const { stdout: shortcut } = result2;
    assertMatch(shortcut, re);
  });
});
