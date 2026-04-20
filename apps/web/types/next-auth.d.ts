/**
 * next-auth の Session / JWT を拡張し、API トークンなどを型付けする。
 */
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    apiToken?: string;
    apiExpiresAt?: string;
    userId?: number;
    role?: string;
    providerKey?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    apiToken?: string;
    apiExpiresAt?: string;
    userId?: number;
    role?: string;
    providerKey?: string;
  }
}
