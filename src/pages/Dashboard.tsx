import { Briefcase, BriefcaseIcon, Building2, FolderOpen, Users } from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { DeleteOldJobsButton } from '@/components/dashboard/DeleteOldJobsButton';
import { useDashboardStats } from '@/hooks/useFirestore';
import { Skeleton } from '@/components/ui/skeleton';

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's an overview of your job portal.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
          <StatsCard
            title="Total Jobs"
            value={stats.totalJobs}
            icon={Briefcase}
          />
          <StatsCard
            title="Active Jobs"
            value={stats.activeJobs}
            icon={BriefcaseIcon}
          />
          <StatsCard
            title="Companies"
            value={stats.companiesCount}
            icon={Building2}
          />
          <StatsCard
            title="Categories"
            value={stats.categoriesCount}
            icon={FolderOpen}
          />
          <StatsCard
            title="Total Applied"
            value={stats.totalApplied}
            icon={Users}
          />
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-semibold text-lg text-card-foreground mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a
              href="/jobs"
              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Add New Job</p>
                <p className="text-sm text-muted-foreground">Create a new job listing</p>
              </div>
            </a>
            <a
              href="/companies"
              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Add New Company</p>
                <p className="text-sm text-muted-foreground">Register a new company</p>
              </div>
            </a>
            <a
              href="/categories"
              className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted transition-colors"
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <FolderOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Manage Categories</p>
                <p className="text-sm text-muted-foreground">Add or edit job categories</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border border-border">
          <h3 className="font-semibold text-lg text-card-foreground mb-4">System Status</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-foreground">Firebase Connection</span>
              </div>
              <span className="text-sm text-success font-medium">Connected</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-foreground">Storage Service</span>
              </div>
              <span className="text-sm text-success font-medium">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="text-foreground">Authentication</span>
              </div>
              <span className="text-sm text-success font-medium">Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}