import { describe, expect, test } from "vitest";
import * as typeExports from "./index";

describe("types/index exports", () => {
  test("re-exports runtime values from enums", () => {
    expect(typeExports).toBeTypeOf("object");
    expect(Object.keys(typeExports)).toHaveLength(0);
  });
});
