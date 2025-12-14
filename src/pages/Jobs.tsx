import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Search, Star, Copy, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { JobForm } from '@/components/jobs/JobForm';
import { useJobs, useCompanies, useCategories } from '@/hooks/useFirestore';
import { Job } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export default function Jobs() {
  const {
    jobs,
    loading,
    deleteJob,
    updateJobSharedStatus,
  } = useJobs();

  const { companies } = useCompanies();
  const { categories } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);
  const [shareConfirmJob, setShareConfirmJob] = useState<Job | null>(null);
  const [nextShareValue, setNextShareValue] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, categoryFilter]);

  const getCompanyName = (company: Job['company'] | string | undefined) => {
    if (!company) return 'Unknown';
    if (typeof company === 'string') {
      return companies.find(c => c.id === company)?.name || 'Unknown';
    }
    return company.name;
  };

  const getCategoryName = (category: Job['category'] | string | undefined) => {
    if (!category) return 'Unknown';
    if (typeof category === 'string') {
      return categories.find(c => c.id === category)?.name || 'Unknown';
    }
    return category.name;
  };

  const getCategoryId = (category: Job['category'] | string | undefined) =>
    typeof category === 'string' ? category : category?.id;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const confirmShareUpdate = async () => {
    if (!shareConfirmJob) return;

    await updateJobSharedStatus(shareConfirmJob.id, nextShareValue);

    toast({
      title: 'Updated',
      description: nextShareValue
        ? 'Job marked as shared'
        : 'Job marked as not shared',
    });

    setShareConfirmJob(null);
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const companyName = getCompanyName(job.company);
      return (
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        companyName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }).filter(job => {
      const matchesStatus =
        statusFilter === 'all' || job.status === statusFilter;
      const matchesCategory =
        categoryFilter === 'all' ||
        getCategoryId(job.category) === categoryFilter;
      return matchesStatus && matchesCategory;
    });
  }, [jobs, searchQuery, statusFilter, categoryFilter, getCompanyName]);

  const sortedJobs = useMemo(() => {
    const jobsCopy = [...filteredJobs];

    return jobsCopy.sort((a, b) => {
      if (a.is_shared === b.is_shared) return 0;

      if (a.is_shared === false && b.is_shared === true) return -1;
      if (a.is_shared === true && b.is_shared === false) return 1;

      if (a.is_shared === undefined && b.is_shared === false) return 1;
      if (a.is_shared === false && b.is_shared === undefined) return -1;
      if (a.is_shared === undefined && b.is_shared === true) return -1;
      if (a.is_shared === true && b.is_shared === undefined) return 1;

      return 0;
    });
  }, [filteredJobs]);

  // Step 3: Pagination
  const JOBS_PER_PAGE = 12;
  const totalPages = Math.ceil(sortedJobs.length / JOBS_PER_PAGE);

  // Calculate paginated jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * JOBS_PER_PAGE;
    const endIndex = startIndex + JOBS_PER_PAGE;
    return sortedJobs.slice(startIndex, endIndex);
  }, [sortedJobs, currentPage]);

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (deletingJob) {
      await deleteJob(deletingJob.id);
      setDeletingJob(null);
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingJob(null);
  };

  const getShareMessage = (job: Job) => {
    const jobUrl = `https://seekjobslk.com/job/${job.id}`;
    return `📌 ${job.title}

🏢 Company: ${getCompanyName(job.company)}
📍 Location: ${job.location}
💼 Job Type: ${job.job_type}

🔗 Apply here:
${jobUrl}

🔔 Stay updated with new jobs`;
  };

  const handleCopy = async (job: Job) => {
    try {
      await navigator.clipboard.writeText(getShareMessage(job));
      await updateJobSharedStatus(job.id, true);

      toast({
        title: 'Copied',
        description: 'Job message copied & marked as shared',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy message',
        variant: 'destructive',
      });
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Jobs</h1>
          <p className="text-muted-foreground">Manage all job listings</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Job
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <>
              <table className="w-full border-collapse text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Title</th>
                    <th className="px-4 py-3 text-center font-medium">
                      Company
                    </th>
                    <th className="px-4 py-3 text-left font-medium hidden md:table-cell">
                      Category
                    </th>
                    <th className="px-4 py-3 text-center font-medium hidden lg:table-cell">
                      Type
                    </th>
                    <th className="px-4 py-3 text-center font-medium">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-medium hidden lg:table-cell">
                      Applied
                    </th>
                    <th className="px-4 py-3 text-center font-medium hidden md:table-cell">
                      Posted
                    </th>
                    <th className="px-4 py-3 text-center font-medium w-20">
                      Shared
                    </th>
                    <th className="px-4 py-3 text-center font-medium w-32">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedJobs.map(job => (
                    <tr key={job.id} className="border-t hover:bg-muted/40">
                      <td className="px-4 py-3 text-left">
                        <div className="flex items-center gap-2 font-medium">
                          {job.is_featured && (
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
                          )}
                          <span className="truncate max-w-[260px]">{job.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {getCompanyName(job.company)}
                      </td>
                      <td className="px-4 py-3 text-left hidden md:table-cell">
                        {getCategoryName(job.category)}
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {job.job_type}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            job.status === 'Active'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-200 text-gray-700'
                          )}
                        >
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden lg:table-cell">
                        {job.applied_count}
                      </td>
                      <td className="px-4 py-3 text-center hidden md:table-cell whitespace-nowrap">
                        {formatDate(job.posted_date)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={job.is_shared ?? false}
                            onCheckedChange={(checked) => {
                              setShareConfirmJob(job);
                              setNextShareValue(Boolean(checked));
                            }}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleCopy(job)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(job)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setDeletingJob(job)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
              {sortedJobs.length > 0 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * JOBS_PER_PAGE + 1} to{' '}
                    {Math.min(currentPage * JOBS_PER_PAGE, sortedJobs.length)} of{' '}
                    {sortedJobs.length} jobs
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages || totalPages === 0}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <JobForm open={isFormOpen} onClose={handleCloseForm} editJob={editingJob} />

      <AlertDialog open={!!deletingJob} onOpenChange={() => setDeletingJob(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingJob?.title}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!shareConfirmJob}
        onOpenChange={() => setShareConfirmJob(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {nextShareValue
                ? 'Are you sure you want to mark this job as shared?'
                : 'Are you sure you want to unmark this job as shared?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmShareUpdate}>
              Yes, Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}