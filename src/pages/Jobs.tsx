import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, Star, Copy } from 'lucide-react';
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
import { JobForm } from '@/components/jobs/JobForm';
import { useJobs, useCompanies, useCategories } from '@/hooks/useFirestore';
import { Job } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';

export default function Jobs() {
  const { jobs, loading, deleteJob } = useJobs();
  const { companies } = useCompanies();
  const { categories } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [deletingJob, setDeletingJob] = useState<Job | null>(null);

  const getCompanyName = (company: Job['company'] | string | undefined) => {
    if (!company) return 'Unknown';
    if (typeof company === 'string') {
      const match = companies.find((c) => c.id === company);
      return match?.name || 'Unknown';
    }
    if (company.name) return company.name;
    const match = companies.find((c) => c.id === company.id);
    return match?.name || 'Unknown';
  };

  const getCategoryName = (category: Job['category'] | string | undefined) => {
    if (!category) return 'Unknown';
    if (typeof category === 'string') {
      const match = categories.find((c) => c.id === category);
      return match?.name || 'Unknown';
    }
    if (category.name) return category.name;
    const match = categories.find((c) => c.id === category.id);
    return match?.name || 'Unknown';
  };

  const getCategoryId = (category: Job['category'] | string | undefined) => {
    if (!category) return undefined;
    return typeof category === 'string' ? category : category.id;
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredJobs = jobs.filter((job) => {
    const companyName = getCompanyName(job.company);
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      companyName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    const jobCategoryId = getCategoryId(job.category);
    const matchesCategory = categoryFilter === 'all' || jobCategoryId === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

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
      toast({
        title: 'Copied',
        description: 'Job message copied to clipboard',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to copy message',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage all job listings</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Job
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
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
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Jobs Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-muted-foreground">No jobs found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Company</th>
                  <th className="hidden md:table-cell">Category</th>
                  <th className="hidden lg:table-cell">Type</th>
                  <th>Status</th>
                  <th className="hidden lg:table-cell">Applied</th>
                  <th className="hidden md:table-cell">Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredJobs.map((job) => (
                  <tr key={job.id}>
                    <td>
                      <div className="font-medium flex items-center gap-2">
                        {job.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {job.title}
                      </div>
                    </td>
                    <td>{getCompanyName(job.company)}</td>
                    <td className="hidden md:table-cell">{getCategoryName(job.category)}</td>
                    <td className="hidden lg:table-cell">{job.job_type}</td>
                    <td>
                      <span className={cn('status-badge', job.status === 'Active' ? 'status-active' : 'status-inactive')}>
                        {job.status}
                      </span>
                    </td>
                    <td className="hidden lg:table-cell">{job.applied_count}</td>
                    <td className="hidden md:table-cell">{formatDate(job.posted_date)}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleCopy(job)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(job)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingJob(job)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
    </div>
  );
}
