import { describe, expect, it } from "vitest";
import { normalizeLocalProfile, validateLocalProfile } from "./profile";

const valid = {
  fullName: "Ada Lovelace",
  username: "@ada_1",
  email: "ada@example.com",
  country: "United Kingdom",
  bio: "Learning algorithms.",
  twoFactorEnabled: true,
};

describe("local profile", () => {
  it("validates required identity and optional contact fields", () => {
    expect(validateLocalProfile(valid)).toEqual({});
    expect(
      validateLocalProfile({ ...valid, fullName: " ", username: "ada", email: "wrong" }),
    ).toMatchObject({
      fullName: expect.any(String),
      username: expect.any(String),
      email: expect.any(String),
    });
  });

  it("normalizes saved text and cannot persist a fake 2FA state", () => {
    expect(normalizeLocalProfile({ ...valid, fullName: "  Ada Lovelace ", bio: " Hi " })).toEqual({
      ...valid,
      fullName: "Ada Lovelace",
      bio: "Hi",
      twoFactorEnabled: false,
    });
  });
});
