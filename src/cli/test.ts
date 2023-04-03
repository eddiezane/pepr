// SPDX-License-Identifier: Apache-2.0
// SPDX-FileCopyrightText: 2023-Present The Pepr Authors

import { exec as execCallback } from "child_process";
import { watch } from "chokidar";
import { resolve } from "path";
import { promisify } from "util";
import { Log } from "../lib";
import { buildModule } from "./build";
import { RootCmd } from "./root";

const exec = promisify(execCallback);

export default function (program: RootCmd) {
  program
    .command("test")
    .description("Test a Pepr Module locally")
    .option("-w, --watch", "Watch for changes and re-run the test")
    .action(async opts => {
      Log.info("Test Module");

      await buildAndTest(opts.dir);

      if (opts.watch) {
        const moduleFiles = resolve(opts.dir, "**", "*.ts");
        const watcher = watch(moduleFiles);

        watcher.on("ready", () => {
          Log.info(`Watching for changes in ${moduleFiles}`);
          watcher.on("all", async (event, path) => {
            Log.debug({ event, path }, "File changed");
            await buildAndTest(opts.dir);
          });
        });
      }
    });
}

async function buildAndTest(dir: string) {
  const filename = await buildModule(dir);
  Log.info(`Module built successfully at ${filename}`);

  try {
    const { stdout, stderr } = await exec(`node ${filename}`);
    console.log(stdout);
    console.log(stderr);
  } catch (e) {
    Log.debug(e);
    Log.error(`Error running module: ${e}`);
    process.exit(1);
  }
}
