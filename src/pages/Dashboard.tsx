import { useMemo, useState } from 'react';
import {
  Briefcase,
  BriefcaseIcon,
  Building2,
  CalendarClock,
  CheckCircle,
  FolderOpen,
  Loader2,
  Users,
} from 'lucide-react';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { useDashboardStats, useJobs } from '@/hooks/useFirestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Dashboard() {
  const { stats, loading } = useDashboardStats();
  const { jobs, updateJobActiveStatus } = useJobs();

  const [isInactivateDialogOpen, setInactivateDialogOpen] = useState(false);
  const [isReactivateDialogOpen, setReactivateDialogOpen] = useState(false);
  const [isInactivating, setIsInactivating] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const { oldActiveJobIds, oldInactiveJobIds } = useMemo(() => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 21);

    const active: string[] = [];
    const inactive: string[] = [];

    jobs.forEach(job => {
      const postedTimestamp = job.posted_date;
      const postedDate =
        postedTimestamp && typeof postedTimestamp.toDate === 'function'
          ? postedTimestamp.toDate()
          : null;

      if (!postedDate || postedDate > threshold) {
        return;
      }

      if (job.status === 'Active') {
        active.push(job.id);
      } else if (job.status === 'Inactive') {
        inactive.push(job.id);
      }
    });

    return { oldActiveJobIds: active, oldInactiveJobIds: inactive };
  }, [jobs]);

  const handleInactivateJobs = async () => {
    if (!oldActiveJobIds.length) {
      setInactivateDialogOpen(false);
      return;
    }

    setIsInactivating(true);
    try {
      await updateJobActiveStatus(oldActiveJobIds, false, { skipConfirm: true });
    } catch (error) {
      console.error('Error marking jobs inactive:', error);
    } finally {
      setIsInactivating(false);
      setInactivateDialogOpen(false);
    }
  };

  const handleReactivateJobs = async () => {
    if (!oldInactiveJobIds.length) {
      setReactivateDialogOpen(false);
      return;
    }

    setIsReactivating(true);
    try {
      await updateJobActiveStatus(oldInactiveJobIds, true, { skipConfirm: true });
    } catch (error) {
      console.error('Error reactivating jobs:', error);
    } finally {
      setIsReactivating(false);
      setReactivateDialogOpen(false);
    }
  };

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
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <AlertDialog
            open={isInactivateDialogOpen}
            onOpenChange={open => {
              if (!isInactivating) {
                setInactivateDialogOpen(open);
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                onClick={() => setInactivateDialogOpen(true)}
                disabled={isInactivating || oldActiveJobIds.length === 0}
                className="gap-2"
              >
                {isInactivating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CalendarClock className="h-4 w-4" />
                )}
                Inactivate Old Jobs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Inactivate Older Jobs</AlertDialogTitle>
                <AlertDialogDescription>
                  Jobs older than three weeks will be marked as Inactive. This removes them from
                  active listings while keeping newer jobs unchanged.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isInactivating}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleInactivateJobs} disabled={isInactivating}>
                  {isInactivating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Confirm'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={isReactivateDialogOpen}
            onOpenChange={open => {
              if (!isReactivating) {
                setReactivateDialogOpen(open);
              }
            }}
          >
            <AlertDialogTrigger asChild>
              <Button
                type="button"
                onClick={() => setReactivateDialogOpen(true)}
                disabled={isReactivating || oldInactiveJobIds.length === 0}
                variant="outline"
                className="gap-2"
              >
                {isReactivating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Reactivate Old Jobs
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reactivate Older Jobs</AlertDialogTitle>
                <AlertDialogDescription>
                  Jobs older than three weeks that are currently inactive will be marked Active so
                  they reappear in listings.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isReactivating}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleReactivateJobs} disabled={isReactivating}>
                  {isReactivating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    'Confirm'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
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
