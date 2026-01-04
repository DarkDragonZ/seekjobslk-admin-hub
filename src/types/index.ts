import { Timestamp } from 'firebase/firestore';

export interface EmbeddedCompany {
  id: string;
  name: string;
  location: string;
  logo_url: string;
  website?: string;
}

export interface EmbeddedCategory {
  id: string;
  name: string;
}

export interface Job {
  id: string;
  title: string;

  company?: EmbeddedCompany;
  category?: EmbeddedCategory;

  companyId?: string;
  categoryId?: string;

  job_type: 'Full-Time' | 'Part-Time' | 'Remote' | 'Hybrid';
  salary: string;
  location: string;

  description: string;
  requirements: string;
  apply_url: string;

  status: 'Active' | 'Inactive';
  is_featured: boolean;
  is_shared: boolean;
  is_old_job: boolean;

  posted_date: Timestamp;
  applied_count: number;
}

export interface Company {
  id: string;
  name: string;
  location: string;
  logo_url: string;
  website?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  companiesCount: number;
  categoriesCount: number;
  totalApplied: number;
}
