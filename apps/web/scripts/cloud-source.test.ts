import { describe, expect, it } from "vitest";
import { assertProductionHasCloud } from "./cloud-source.mjs";

describe("production cloud guard", () => {
  it.each(["stub", "missing"])("refuses a production build when the cloud source is %s", (source) => {
    expect(() => assertProductionHasCloud("production", source)).toThrow(
      "Production must build with @bombappetit/cloud",
    );
  });

  it("allows production with the private package, and any source outside production", () => {
    expect(() => assertProductionHasCloud("production", "token")).not.toThrow();
    expect(() => assertProductionHasCloud("preview", "stub")).not.toThrow();
    expect(() => assertProductionHasCloud(undefined, "stub")).not.toThrow();
  });
});
