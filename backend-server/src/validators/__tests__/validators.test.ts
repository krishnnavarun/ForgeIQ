import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "../profile.validators.js";
import { createOrganizationSchema, slugify } from "../organization.validators.js";

describe("updateProfileSchema", () => {
  it("treats a blank string as an explicit clear (null), not a no-op", () => {
    const result = updateProfileSchema.parse({ bio: "" });
    expect(result.bio).toBeNull();
  });

  it("leaves omitted fields untouched (undefined)", () => {
    const result = updateProfileSchema.parse({ bio: "hello" });
    expect(result.headline).toBeUndefined();
  });

  it("rejects a malformed website URL", () => {
    expect(() => updateProfileSchema.parse({ websiteUrl: "not-a-url" })).toThrow();
  });

  it("accepts a well-formed website URL", () => {
    const result = updateProfileSchema.parse({ websiteUrl: "https://example.dev" });
    expect(result.websiteUrl).toBe("https://example.dev");
  });
});

describe("slugify", () => {
  it("lowercases and hyphenates a display name", () => {
    expect(slugify("Acme Engineering Co.")).toBe("acme-engineering-co");
  });

  it("strips characters that are not alphanumeric or hyphen", () => {
    expect(slugify("  Rocket 🚀 Labs!! ")).toBe("rocket-labs");
  });
});

describe("createOrganizationSchema", () => {
  it("requires a name of at least 2 characters", () => {
    expect(() => createOrganizationSchema.parse({ name: "A" })).toThrow();
  });

  it("accepts a valid organization", () => {
    const result = createOrganizationSchema.parse({ name: "Acme Inc" });
    expect(result.name).toBe("Acme Inc");
  });
});
