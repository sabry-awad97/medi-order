/**
 * Onboarding API
 *
 * Provides type-safe access to onboarding-related Tauri commands.
 * Handles first-run setup and initial configuration.
 *
 * @module api/onboarding
 */

import { z } from "zod";
import { invokeCommand } from "@/lib/tauri-api";
import { createLogger } from "@/lib/logger";
import { LoginResponseSchema, type LoginResponse } from "./user.api";

const logger = createLogger("OnboardingAPI");

// ============================================================================
// Schemas
// ============================================================================

/**
 * First-run setup DTO schema
 */
export const FirstRunSetupSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  organization_name: z.string().optional(),
});
export type FirstRunSetup = z.infer<typeof FirstRunSetupSchema>;

// ============================================================================
// First-Run Check
// ============================================================================

/**
 * Check if this is the first run of the application
 *
 * Returns true if no users exist in the database and config indicates first run.
 *
 * @returns Promise<boolean> - True if first run, false otherwise
 */
export async function checkFirstRun(): Promise<boolean> {
  logger.info("Checking first-run status");
  return invokeCommand("check_first_run", z.boolean(), {});
}

// ============================================================================
// First-Run Setup
// ============================================================================

/**
 * Complete first-run setup with custom admin credentials
 *
 * This creates the initial admin user with provided credentials,
 * automatically logs them in, and marks first-run as complete.
 *
 * @param data - First-run setup data with admin credentials
 * @returns Promise<LoginResponse> - Login response with user info and JWT token
 */
export async function completeFirstRunSetup(
  data: FirstRunSetup,
): Promise<LoginResponse> {
  logger.info("Completing first-run setup for user:", data.username);
  return invokeCommand("complete_first_run_setup", LoginResponseSchema, {
    data,
  });
}

/**
 * Complete first-run setup with default credentials
 *
 * This creates an admin user with default credentials (admin/admin123),
 * automatically logs them in, and marks first-run as complete.
 *
 * Useful for automated testing or development environments.
 *
 * @returns Promise<LoginResponse> - Login response with user info and JWT token
 */
export async function completeFirstRunSetupDefault(): Promise<LoginResponse> {
  logger.info("Completing first-run setup with default credentials");
  return invokeCommand(
    "complete_first_run_setup_default",
    LoginResponseSchema,
    {},
  );
}

// ============================================================================
// Exports
// ============================================================================

export const onboardingApi = {
  checkFirstRun,
  completeSetup: completeFirstRunSetup,
  completeSetupDefault: completeFirstRunSetupDefault,
} as const;
