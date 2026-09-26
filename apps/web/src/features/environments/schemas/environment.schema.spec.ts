import { describe, expect, it } from "vitest";
import {
  environmentFormSchema,
  toCreateEnvironmentInput,
  toUpdateEnvironmentInput,
} from "./environment.schema";
import {
  environmentCategoryLabel,
  environmentRuntimeSummary,
} from "../presentation";

const valid = {
  name: "  Local development  ",
  category: "LOCAL",
  operatingSystem: "  Ubuntu 24.04 ",
  runtime: "",
  runtimeVersion: "",
  description: "",
};
describe("environment form", () => {
  it("trims and maps empty optional fields differently for create and edit", () => {
    const result = environmentFormSchema.parse(valid);
    expect(result.name).toBe("Local development");
    expect(result.operatingSystem).toBe("Ubuntu 24.04");
    expect(toCreateEnvironmentInput(result).runtime).toBeUndefined();
    expect(toUpdateEnvironmentInput(result).runtime).toBeNull();
  });
  it("rejects invalid names, categories, and oversized details", () => {
    expect(
      environmentFormSchema.safeParse({ ...valid, name: " " }).success,
    ).toBe(false);
    expect(
      environmentFormSchema.safeParse({ ...valid, category: "INVALID" })
        .success,
    ).toBe(false);
    expect(
      environmentFormSchema.safeParse({
        ...valid,
        description: "x".repeat(1001),
      }).success,
    ).toBe(false);
  });
  it("formats category and runtime summaries", () => {
    expect(environmentCategoryLabel("PRODUCTION")).toBe("Production");
    expect(environmentRuntimeSummary("Node.js", "22")).toBe("Node.js 22");
    expect(environmentRuntimeSummary(null, null)).toBe("Runtime not specified");
  });
});
