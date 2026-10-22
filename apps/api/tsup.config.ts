import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  target: "node22",
  platform: "node",
  clean: true,
  noExternal: [/^@luxe-hair\//],
  // Pulled in through @luxe-hair/db; CommonJS, so they must load from node_modules, not the ESM bundle.
  external: ["pg", /^@prisma\//],
});
