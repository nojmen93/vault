/**
 * Unit tests for utility functions
 */

import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (classNames utility)", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles single class", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("handles undefined and null values", () => {
    expect(cn("foo", undefined, "bar", null)).toBe("foo bar");
  });

  it("handles boolean conditionals", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
    expect(cn("foo", true && "bar", "baz")).toBe("foo bar baz");
  });

  it("handles arrays", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
    expect(cn("base", ["conditional", "classes"])).toBe("base conditional classes");
  });

  it("handles objects", () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe("foo baz");
  });

  it("merges Tailwind classes correctly", () => {
    // tailwind-merge should handle conflicting classes
    expect(cn("p-4", "p-2")).toBe("p-2");
    expect(cn("px-4", "px-2")).toBe("px-2");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves non-conflicting classes", () => {
    expect(cn("p-4", "m-2")).toBe("p-4 m-2");
    expect(cn("text-red-500", "bg-blue-500")).toBe("text-red-500 bg-blue-500");
  });

  it("handles complex combinations", () => {
    const isActive = true;
    const isDisabled = false;

    const result = cn(
      "base-class",
      "rounded-lg",
      isActive && "active-class",
      isDisabled && "disabled-class",
      { "conditional-class": true, "skipped-class": false }
    );

    expect(result).toBe("base-class rounded-lg active-class conditional-class");
  });

  it("handles responsive Tailwind classes", () => {
    expect(cn("p-4", "md:p-6", "lg:p-8")).toBe("p-4 md:p-6 lg:p-8");
  });

  it("handles hover/focus states", () => {
    expect(cn("bg-blue-500", "hover:bg-blue-600", "focus:bg-blue-700")).toBe(
      "bg-blue-500 hover:bg-blue-600 focus:bg-blue-700"
    );
  });
});
