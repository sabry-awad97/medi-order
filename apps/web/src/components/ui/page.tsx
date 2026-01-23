import * as React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Page Root Component
interface PageProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function Page({ className, children, ...props }: PageProps) {
  return (
    <div
      className={cn("flex flex-col h-full w-full", className)}
      dir="rtl"
      {...props}
    >
      {children}
    </div>
  );
}

// Page Header Component
interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  sticky?: boolean;
}

function PageHeader({
  className,
  children,
  sticky = true,
  ...props
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "z-10 border-b border-dashed bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 shrink-0",
        sticky && "sticky top-0",
        className,
      )}
      {...props}
    >
      <div className="px-6 py-4">
        <div className="flex items-center gap-4">{children}</div>
      </div>
    </div>
  );
}

// Page Header Trigger (Sidebar Toggle)
interface PageHeaderTriggerProps extends React.ComponentProps<
  typeof SidebarTrigger
> {}

function PageHeaderTrigger({ className, ...props }: PageHeaderTriggerProps) {
  return <SidebarTrigger className={cn("shrink-0", className)} {...props} />;
}

// Page Header Content (Title and Subtitle)
interface PageHeaderContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageHeaderContent({
  className,
  children,
  ...props
}: PageHeaderContentProps) {
  return (
    <div className={cn("flex-1 min-w-0", className)} {...props}>
      {children}
    </div>
  );
}

// Page Header Title
interface PageHeaderTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

function PageHeaderTitle({
  className,
  children,
  ...props
}: PageHeaderTitleProps) {
  return (
    <h1
      className={cn("text-3xl font-bold text-foreground truncate", className)}
      {...props}
    >
      {children}
    </h1>
  );
}

// Page Header Description
interface PageHeaderDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode;
}

function PageHeaderDescription({
  className,
  children,
  ...props
}: PageHeaderDescriptionProps) {
  return (
    <p
      className={cn("text-sm text-muted-foreground mt-1 truncate", className)}
      {...props}
    >
      {children}
    </p>
  );
}

// Page Header Actions
interface PageHeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageHeaderActions({
  className,
  children,
  ...props
}: PageHeaderActionsProps) {
  return (
    <div className={cn("shrink-0", className)} {...props}>
      {children}
    </div>
  );
}

// Page Content Component
interface PageContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  scrollable?: boolean;
}

function PageContent({
  className,
  children,
  scrollable = true,
  ...props
}: PageContentProps) {
  return (
    <div
      className={cn(
        "flex-1 flex flex-col min-h-0",
        scrollable && "overflow-y-auto",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Page Content Inner (with padding)
interface PageContentInnerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageContentInner({
  className,
  children,
  ...props
}: PageContentInnerProps) {
  return (
    <div className={cn("px-6 py-6", className)} {...props}>
      {children}
    </div>
  );
}

// Page Section Component
interface PageSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageSection({ className, children, ...props }: PageSectionProps) {
  return (
    <div className={cn("space-y-4", className)} {...props}>
      {children}
    </div>
  );
}

// Page Section Header
interface PageSectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageSectionHeader({
  className,
  children,
  ...props
}: PageSectionHeaderProps) {
  return (
    <div
      className={cn("flex items-center justify-between shrink-0", className)}
      {...props}
    >
      {children}
    </div>
  );
}

// Page Section Title
interface PageSectionTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

function PageSectionTitle({
  className,
  children,
  ...props
}: PageSectionTitleProps) {
  return (
    <h3 className={cn("text-lg font-semibold", className)} {...props}>
      {children}
    </h3>
  );
}

// Page Section Actions
interface PageSectionActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageSectionActions({
  className,
  children,
  ...props
}: PageSectionActionsProps) {
  return (
    <div className={cn("shrink-0", className)} {...props}>
      {children}
    </div>
  );
}

// Page Section Content
interface PageSectionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function PageSectionContent({
  className,
  children,
  ...props
}: PageSectionContentProps) {
  return (
    <div className={cn("", className)} {...props}>
      {children}
    </div>
  );
}

export {
  Page,
  PageHeader,
  PageHeaderTrigger,
  PageHeaderContent,
  PageHeaderTitle,
  PageHeaderDescription,
  PageHeaderActions,
  PageContent,
  PageContentInner,
  PageSection,
  PageSectionHeader,
  PageSectionTitle,
  PageSectionActions,
  PageSectionContent,
};
