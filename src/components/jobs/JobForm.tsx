import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import { toast } from '@/components/ui/use-toast';
import { Timestamp } from 'firebase/firestore';
import { Job, Company, Category } from '@/types';
import { useCompanies, useCategories, useJobs } from '@/hooks/useFirestore';
import CompanyForm from '@/components/company/CompanyForm';

interface JobFormProps {
  open: boolean;
  onClose: () => void;
  editJob?: Job | null;
}

const JOB_TYPES = ['Full-Time', 'Part-Time', 'Remote', 'Hybrid'] as const;

const getShareMessage = (job: Job) => {
  const jobUrl = `https://seekjobslk.com/job/${job.id}`;

  return `📌 ${job.title}

🏢 Company: ${job.company?.name ?? 'N/A'}
📍 Location: ${job.location || 'N/A'}
💼 Job Type: ${job.job_type}

🔗 Apply here:
${jobUrl}

🔔 Stay updated with new jobs`;
};

type JobFormState = {
  title: string;
  company: Company | null;
  category: Category | null;
  job_type: Job['job_type'];
  salary: string;
  location: string;
  description: string;
  requirements: string;
  apply_url: string;
  status: Job['status'];
  is_featured: boolean;
  is_shared: boolean;
};

export function JobForm({ open, onClose, editJob }: JobFormProps) {
  const { companies, addCompany } = useCompanies();
  const { categories } = useCategories();
  const { addJob, updateJob } = useJobs();

  const [formData, setFormData] = useState<JobFormState>({
    title: '',
    company: null,
    category: null,
    job_type: 'Full-Time',
    salary: '',
    location: '',
    description: '',
    requirements: '',
    apply_url: '',
    status: 'Active',
    is_featured: false,
    is_shared: false,
  });

  const [companySearch, setCompanySearch] = useState('');
  const [isCompanyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const [isCompanyFormOpen, setCompanyFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedCompanySearch = companySearch.trim().toLowerCase();
  const sortedCompanies = [...companies].sort((a, b) =>
    a.name.localeCompare(b.name)
  );
  const companySuggestions = normalizedCompanySearch
    ? sortedCompanies.filter((company) =>
      company.name.toLowerCase().includes(normalizedCompanySearch)
    )
    : sortedCompanies;
  const hasCompanyMatches = companySuggestions.length > 0;

  useEffect(() => {
    if (editJob) {
      setFormData({
        title: editJob.title,
        company: editJob.company,
        category: editJob.category,
        job_type: editJob.job_type,
        salary: editJob.salary,
        location: editJob.location,
        description: editJob.description,
        requirements: editJob.requirements,
        apply_url: editJob.apply_url,
        status: editJob.status ?? 'Active',
        is_featured: editJob.is_featured ?? false,
        is_shared: editJob.is_shared ?? false,
      });
      setCompanySearch(editJob.company?.name ?? '');
    } else {
      setFormData({
        title: '',
        company: null,
        category: null,
        job_type: 'Full-Time',
        salary: '',
        location: '',
        description: '',
        requirements: '',
        apply_url: '',
        status: 'Active',
        is_featured: false,
        is_shared: false,
      });
      setCompanySearch('');
    }
  }, [editJob, open]);

  useEffect(() => {
    if (open && formData.company) {
      setCompanySearch(formData.company.name);
    }
  }, [open, formData.company]);

  const handleCompanyInputChange = (value: string) => {
    setCompanySearch(value);
    setCompanyDropdownOpen(true);
    setFormData((prev) => ({ ...prev, company: null }));
  };

  const handleCompanySelect = (company: Company) => {
    setFormData((prev) => ({
      ...prev,
      company,
      location: company.location ?? prev.location,
    }));
    setCompanySearch(company.name);
    setCompanyDropdownOpen(false);
  };

  const handleCompanyFormSubmit = async (data: Omit<Company, 'id'>) => {
    const newId = await addCompany(data);

    if (newId) {
      const newCompany: Company = { id: newId, ...data };
      setFormData((prev) => ({
        ...prev,
        company: newCompany,
        location: data.location ?? prev.location,
      }));
      setCompanySearch(data.name);
      setCompanyDropdownOpen(false);
    }
  };

  const handleCompanyInputBlur = () => {
    setTimeout(() => setCompanyDropdownOpen(false), 120);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (!formData.company || !formData.category) {
        setIsSubmitting(false);
        return;
      }

      const jobData: Omit<Job, 'id' | 'posted_date' | 'applied_count'> = {
        ...formData,
        company: formData.company,
        category: formData.category,
      };

      if (editJob) {
        await updateJob(editJob.id, jobData);
      } else {
        const newJobId = await addJob(jobData);

        if (newJobId) {
          const newJob: Job = {
            id: newJobId,
            title: formData.title,
            company: formData.company,
            category: formData.category,
            job_type: formData.job_type,
            salary: formData.salary,
            location: formData.location,
            description: formData.description,
            requirements: formData.requirements,
            apply_url: formData.apply_url,
            status: formData.status,
            is_featured: formData.is_featured,
            is_shared: formData.is_shared,
            posted_date: Timestamp.now(),
            applied_count: 0,
          };

          const shareMessage = getShareMessage(newJob);
          await navigator.clipboard.writeText(shareMessage);
          toast({ title: 'Copied', description: 'Job share message copied to clipboard' });
        }
      }

      onClose();
    } catch (error) {
      console.error('Error saving job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editJob ? 'Edit Job' : 'Add New Job'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g. Senior Software Engineer"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="company-search">Company *</Label>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="relative flex-1">
                    <Input
                      id="company-search"
                      value={companySearch}
                      onChange={(e) =>
                        handleCompanyInputChange(e.target.value)
                      }
                      onFocus={() => setCompanyDropdownOpen(true)}
                      onBlur={handleCompanyInputBlur}
                      placeholder="Search companies..."
                      autoComplete="off"
                    />

                    {isCompanyDropdownOpen && (
                      <div className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-md border bg-popover p-1 shadow-lg">
                        {hasCompanyMatches ? (
                          companySuggestions.map((company) => (
                            <button
                              key={company.id}
                              type="button"
                              className={`flex w-full flex-col rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground`}
                              onMouseDown={(event) => {
                                event.preventDefault();
                                handleCompanySelect(company);
                              }}
                            >
                              <span className="font-medium">{company.name}</span>
                              {company.location && (
                                <span className="text-xs text-muted-foreground">
                                  {company.location}
                                </span>
                              )}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            No companies found. Use "Add Company" to create one.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCompanyFormOpen(true)}
                  >
                    Add Company
                  </Button>
                </div>

                {!formData.company && (
                  <p className="mt-1 text-xs text-gray-500">
                    Select a company before saving.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category?.id ?? ''}
                  onValueChange={(id) => {
                    const category = categories.find((c) => c.id === id) || null;
                    setFormData((prev) => ({ ...prev, category }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="job_type">Job Type *</Label>
                <Select
                  value={formData.job_type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      job_type: value as Job['job_type'],
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="md:col-span-2 flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Featured Listing
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Highlight this job in featured sections.
                  </p>
                </div>
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      is_featured: checked,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="e.g. $50,000 - $70,000"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="apply_url">Apply URL *</Label>
                <Input
                  id="apply_url"
                  type="url"
                  value={formData.apply_url}
                  onChange={(e) =>
                    setFormData({ ...formData, apply_url: e.target.value })
                  }
                  placeholder="https://..."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Job description..."
                  rows={4}
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-border">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || !formData.company}>
                {isSubmitting
                  ? 'Saving...'
                  : editJob
                    ? 'Update Job'
                    : 'Create Job'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCompanyFormOpen} onOpenChange={setCompanyFormOpen}>
        <CompanyForm
          company={null}
          open={isCompanyFormOpen}
          onClose={() => setCompanyFormOpen(false)}
          onSubmit={handleCompanyFormSubmit}
        />
      </Dialog>
    </>
  );
}
