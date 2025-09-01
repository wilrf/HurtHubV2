import { describe, it, expect } from "vitest";
import {
  isValidEmail,
  isValidPhoneNumber,
  isValidUrl,
  isValidPassword,
  isValidZipCode,
  isEmpty,
  isValidNumber,
} from "./validators";

describe("Validators", () => {
  describe("isValidEmail", () => {
    it("should validate correct email addresses", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name+tag@domain.co.uk")).toBe(true);
    });

    it("should reject invalid email addresses", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("@example.com")).toBe(false);
      expect(isValidEmail("test@")).toBe(false);
    });
  });

  describe("isValidPhoneNumber", () => {
    it("should validate US phone numbers", () => {
      expect(isValidPhoneNumber("(555) 123-4567")).toBe(true);
      expect(isValidPhoneNumber("555-123-4567")).toBe(true);
      expect(isValidPhoneNumber("5551234567")).toBe(true);
      expect(isValidPhoneNumber("+1 555 123 4567")).toBe(true);
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhoneNumber("123")).toBe(false);
      expect(isValidPhoneNumber("abcdefghij")).toBe(false);
    });
  });

  describe("isValidUrl", () => {
    it("should validate correct URLs", () => {
      expect(isValidUrl("https://example.com")).toBe(true);
      expect(isValidUrl("http://subdomain.example.com/path")).toBe(true);
      expect(isValidUrl("ftp://files.example.com")).toBe(true);
    });

    it("should reject invalid URLs", () => {
      expect(isValidUrl("not a url")).toBe(false);
      expect(isValidUrl("example.com")).toBe(false);
    });
  });

  describe("isValidPassword", () => {
    it("should validate strong passwords", () => {
      const result = isValidPassword("StrongP@ss123");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject weak passwords", () => {
      const result = isValidPassword("weak");
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("isValidZipCode", () => {
    it("should validate US ZIP codes", () => {
      expect(isValidZipCode("12345")).toBe(true);
      expect(isValidZipCode("12345-6789")).toBe(true);
    });

    it("should reject invalid ZIP codes", () => {
      expect(isValidZipCode("1234")).toBe(false);
      expect(isValidZipCode("abcde")).toBe(false);
    });
  });

  describe("isEmpty", () => {
    it("should correctly identify empty values", () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty("")).toBe(true);
      expect(isEmpty("   ")).toBe(true);
    });

    it("should correctly identify non-empty values", () => {
      expect(isEmpty("text")).toBe(false);
      expect(isEmpty(" text ")).toBe(false);
    });
  });

  describe("isValidNumber", () => {
    it("should validate numbers within range", () => {
      expect(isValidNumber(5, { min: 0, max: 10 })).toBe(true);
      expect(isValidNumber("5.5", { allowFloat: true })).toBe(true);
    });

    it("should reject invalid numbers", () => {
      expect(isValidNumber("abc")).toBe(false);
      expect(isValidNumber(5, { min: 10 })).toBe(false);
      expect(isValidNumber(5.5, { allowFloat: false })).toBe(false);
    });
  });
});