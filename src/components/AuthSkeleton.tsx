import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const AuthSkeleton = () => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 animate-fade-in">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-grid-pattern opacity-5 pointer-events-none" />
      <div className="fixed top-1/4 left-1/4 w-[400px] h-[400px] bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[400px] h-[400px] bg-neon-cyan/10 rounded-full blur-[100px] pointer-events-none" />

      <Card className="w-full max-w-md bg-card/50 backdrop-blur border-border/50 relative z-10">
        <CardHeader className="text-center space-y-4">
          {/* Logo placeholder */}
          <div className="flex justify-center">
            <Skeleton className="h-12 w-12 rounded-lg" />
          </div>
          {/* Title */}
          <Skeleton className="h-8 w-48 mx-auto" />
          {/* Description */}
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Tabs placeholder */}
          <div className="flex gap-2 justify-center">
            <Skeleton className="h-10 w-24 rounded-md" />
            <Skeleton className="h-10 w-24 rounded-md" />
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Email field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>

            {/* Submit button */}
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-px flex-1" />
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-px flex-1" />
          </div>

          {/* Social login buttons */}
          <div className="space-y-3">
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>

          {/* Footer links */}
          <div className="flex justify-center gap-4 pt-4">
            <Skeleton className="h-4 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
