import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/hooks/use-auth";
import { useCompleteFirstRunSetup } from "@/hooks/use-onboarding-db";
import { FirstRunSetupSchema, type FirstRunSetup } from "@/api/onboarding.api";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

type OnboardingFormData = FirstRunSetup & {
  confirmPassword: string;
};

const onboardingFormSchema = FirstRunSetupSchema.extend({
  confirmPassword: FirstRunSetupSchema.shape.password,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const completeSetup = useCompleteFirstRunSetup();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
  });

  const onSubmit = async (data: OnboardingFormData) => {
    const { confirmPassword, ...setupData } = data;

    completeSetup.mutate(setupData, {
      onSuccess: async (response) => {
        if (response.token) {
          // Auto-login with the new credentials
          await login({
            username: data.username,
            password: data.password,
          });

          navigate({ to: "/" });
        }
      },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-2xl shadow-2xl">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </div>
          <CardTitle className="text-3xl font-bold">
            Welcome to MediTrack
          </CardTitle>
          <CardDescription className="text-base">
            Let's set up your administrator account to get started
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.first_name}>
                  <FieldLabel htmlFor="first_name">
                    First Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="first_name"
                    {...register("first_name")}
                    placeholder="John"
                    disabled={completeSetup.isPending}
                    autoFocus
                  />
                  <FieldError>{errors.first_name?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.last_name}>
                  <FieldLabel htmlFor="last_name">
                    Last Name <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="last_name"
                    {...register("last_name")}
                    placeholder="Doe"
                    disabled={completeSetup.isPending}
                  />
                  <FieldError>{errors.last_name?.message}</FieldError>
                </Field>
              </div>

              <Field data-invalid={!!errors.email}>
                <FieldLabel htmlFor="email">
                  Email Address <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="email"
                  {...register("email")}
                  type="email"
                  placeholder="admin@pharmacy.com"
                  disabled={completeSetup.isPending}
                />
                <FieldError>{errors.email?.message}</FieldError>
              </Field>
            </div>

            {/* Account Credentials */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Account Credentials
              </h3>
              <Field data-invalid={!!errors.username}>
                <FieldLabel htmlFor="username">
                  Username <span className="text-destructive">*</span>
                </FieldLabel>
                <Input
                  id="username"
                  {...register("username")}
                  placeholder="admin"
                  disabled={completeSetup.isPending}
                  autoComplete="username"
                />
                <FieldError>{errors.username?.message}</FieldError>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field data-invalid={!!errors.password}>
                  <FieldLabel htmlFor="password">
                    Password <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="password"
                    {...register("password")}
                    type="password"
                    placeholder="••••••••"
                    disabled={completeSetup.isPending}
                    autoComplete="new-password"
                  />
                  <FieldError>{errors.password?.message}</FieldError>
                </Field>

                <Field data-invalid={!!errors.confirmPassword}>
                  <FieldLabel htmlFor="confirmPassword">
                    Confirm Password <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id="confirmPassword"
                    {...register("confirmPassword")}
                    type="password"
                    placeholder="••••••••"
                    disabled={completeSetup.isPending}
                    autoComplete="new-password"
                  />
                  <FieldError>{errors.confirmPassword?.message}</FieldError>
                </Field>
              </div>
            </div>

            {/* Organization (Optional) */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Organization (Optional)
              </h3>
              <Field data-invalid={!!errors.organization_name}>
                <FieldLabel htmlFor="organization_name">
                  Organization Name
                </FieldLabel>
                <Input
                  id="organization_name"
                  {...register("organization_name")}
                  placeholder="My Pharmacy"
                  disabled={completeSetup.isPending}
                />
                <FieldError>{errors.organization_name?.message}</FieldError>
              </Field>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full h-12 text-base font-semibold"
              disabled={completeSetup.isPending}
            >
              {completeSetup.isPending ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Creating Account...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>

            {/* Info Message */}
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p className="font-medium mb-1">🔒 Security Note</p>
              <p>
                This account will have full administrator privileges. Make sure
                to use a strong password and keep your credentials secure.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
