import type { TFunction } from "i18next";
import * as z from "zod/v3";

/**
 * Create a localized Zod error map
 *
 * @param t - Translation function from useTranslation hook
 * @returns Zod error map function
 *
 * @example
 * ```tsx
 * const { t } = useTranslation("validation");
 * z.setErrorMap(createZodErrorMap(t));
 * ```
 */
export function createZodErrorMap(t: TFunction): z.ZodErrorMap {
  return (issue, ctx) => {
    try {
      let message: string;

      switch (issue.code) {
        case "invalid_type":
          if (issue.received === "undefined") {
            message = t("validation:errors.required", {
              field: issue.path.join("."),
              defaultValue: ctx.defaultError,
            });
          } else {
            message = t("validation:errors.invalid_type", {
              expected: issue.expected,
              received: issue.received,
              defaultValue: ctx.defaultError,
            });
          }
          break;

        case "invalid_string":
          if (issue.validation === "email") {
            message = t("validation:errors.email", {
              defaultValue: ctx.defaultError,
            });
          } else if (issue.validation === "uuid") {
            message = t("validation:errors.uuid", {
              defaultValue: ctx.defaultError,
            });
          } else {
            message = t("validation:errors.invalid_string", {
              defaultValue: ctx.defaultError,
            });
          }
          break;

        case "too_small":
          if (issue.type === "string") {
            message = t("validation:errors.minLength", {
              min: issue.minimum,
              defaultValue: ctx.defaultError,
            });
          } else {
            message = t("validation:errors.min", {
              min: issue.minimum,
              defaultValue: ctx.defaultError,
            });
          }
          break;

        case "too_big":
          if (issue.type === "string") {
            message = t("validation:errors.maxLength", {
              max: issue.maximum,
              defaultValue: ctx.defaultError,
            });
          } else {
            message = t("validation:errors.max", {
              max: issue.maximum,
              defaultValue: ctx.defaultError,
            });
          }
          break;

        case "invalid_enum_value":
          message = t("validation:errors.invalid_enum_value", {
            options: issue.options.join(", "),
            defaultValue: ctx.defaultError,
          });
          break;

        default:
          message = t("validation:errors.custom", {
            defaultValue: ctx.defaultError,
          });
      }

      return { message };
    } catch (error) {
      console.error("Error translating validation message:", error);
      return { message: ctx.defaultError };
    }
  };
}

/**
 * Create a localized Zod schema by applying the error map
 *
 * This function sets the global Zod error map to use localized messages.
 * This is the recommended approach for applying custom error messages in Zod.
 *
 * @param schema - The Zod schema to use
 * @param t - Translation function from useTranslation hook
 * @returns The original schema (error map is applied globally)
 *
 * @example
 * ```tsx
 * const { t } = useTranslation("validation");
 *
 * // This sets the global error map
 * localizedZodSchema(
 *   z.object({
 *     email: z.string().email(),
 *     password: z.string().min(8),
 *   }),
 *   t
 * );
 *
 * // All subsequent validations will use localized messages
 * const result = schema.safeParse(formData);
 * ```
 */
export function localizedZodSchema<T extends z.ZodTypeAny>(
  schema: T,
  t: TFunction,
): T {
  // Set the global error map - this is the recommended way in Zod
  const errorMap = createZodErrorMap(t);
  z.setErrorMap(errorMap);

  return schema;
}
