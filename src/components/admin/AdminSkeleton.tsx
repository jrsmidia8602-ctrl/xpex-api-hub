import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Navbar from "@/components/Navbar";

export const AdminSkeleton = () => {
  return (
    <div className="min-h-screen bg-background animate-fade-in">
      <Navbar />

      <main className="pt-24 pb-16 container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Skeleton className="h-9 w-48 mb-2" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 bg-card/50 backdrop-blur border-border/50">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-4 w-10" />
              </div>
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-20" />
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <Skeleton className="h-10 w-96 rounded-lg" />
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Recent Activity Card */}
          <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-32" />
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div>
                    <Skeleton className="h-4 w-28 mb-1" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </Card>

          {/* System Health Card */}
          <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-5 w-28" />
            </div>
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="p-6 bg-card/50 backdrop-blur border-border/50">
          <Skeleton className="h-5 w-28 mb-4" />
          <div className="flex flex-wrap gap-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-9 w-32 rounded-md" />
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
};
