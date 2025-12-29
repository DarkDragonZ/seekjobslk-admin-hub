import { useState, useEffect } from 'react';
import {
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  where,
  getDocs,
  Timestamp,
  orderBy,
  writeBatch,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Job, Company, Category, DashboardStats } from '@/types';
import { toast } from '@/hooks/use-toast';

/* ==================== JOBS ==================== */

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('posted_date', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsData: Job[] = snapshot.docs.map((d) => {
          const data = d.data();

          return {
            id: d.id,
            title: data.title ?? '',

            company: data.company,
            category: data.category,

            companyId: data.companyId,
            categoryId: data.categoryId,

            job_type: data.job_type,
            salary: data.salary ?? '',
            location: data.location ?? '',

            description: data.description ?? '',
            requirements: data.requirements ?? '',
            apply_url: data.apply_url ?? '',

            status: data.status ?? 'Inactive',
            is_featured: data.is_featured ?? false,
            is_shared: data.is_shared ?? false,

            posted_date: data.posted_date,
            applied_count: data.applied_count ?? 0,
          };
        });

        setJobs(jobsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching jobs:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  type CreateJobInput = Omit<Job, 'id' | 'posted_date' | 'applied_count'>;

  const addJob = async (jobData: CreateJobInput) => {
    try {
      const docRef = await addDoc(collection(db, 'jobs'), {
        ...jobData,
        posted_date: Timestamp.now(),
        applied_count: 0,
        is_shared: jobData.is_shared ?? false,
      });

      toast({ title: 'Success', description: 'Job created successfully' });
      return docRef.id;
    } catch (error) {
      console.error('Error adding job:', error);
      toast({
        title: 'Error',
        description: 'Failed to create job',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    try {
      await updateDoc(doc(db, 'jobs', id), jobData);
      toast({ title: 'Success', description: 'Job updated successfully' });
    } catch (error) {
      console.error('Error updating job:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job',
        variant: 'destructive',
      });
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', id));
      toast({ title: 'Success', description: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job',
        variant: 'destructive',
      });
    }
  };

  const updateJobSharedStatus = async (jobId: string, value: boolean) => {
    try {
      await updateDoc(doc(db, 'jobs', jobId), { is_shared: value });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update shared status',
        variant: 'destructive',
      });
    }
  };

  const deleteOldJobs = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const q = query(
        collection(db, 'jobs'),
        where('posted_date', '<', Timestamp.fromDate(thirtyDaysAgo))
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();

      toast({
        title: 'Success',
        description: `Deleted ${snapshot.docs.length} jobs older than 30 days`,
      });

      return snapshot.docs.length;
    } catch (error) {
      console.error('Error deleting old jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete old jobs',
        variant: 'destructive',
      });
      return 0;
    }
  };

  return {
    jobs,
    loading,
    addJob,
    updateJob,
    deleteJob,
    deleteOldJobs,
    updateJobSharedStatus,
  };
}

/* ==================== COMPANIES ==================== */

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Company[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Company, 'id'>),
        }));

        setCompanies(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const addCompany = async (companyData: Omit<Company, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'companies'), companyData);
      toast({ title: 'Success', description: 'Company created successfully' });
      return docRef.id;
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create company',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateCompany = async (id: string, data: Partial<Company>) => {
    try {
      await updateDoc(doc(db, 'companies', id), data);
      toast({ title: 'Success', description: 'Company updated successfully' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update company',
        variant: 'destructive',
      });
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      toast({ title: 'Success', description: 'Company deleted successfully' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete company',
        variant: 'destructive',
      });
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const path = `logos/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to upload logo',
        variant: 'destructive',
      });
      return null;
    }
  };

  return { companies, loading, addCompany, updateCompany, deleteCompany, uploadLogo };
}

/* ==================== CATEGORIES ==================== */

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Category[] = snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Category, 'id'>),
        }));
        setCategories(data);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsubscribe();
  }, []);

  const addCategory = async (name: string) => {
    try {
      await addDoc(collection(db, 'categories'), { name });
      toast({ title: 'Success', description: 'Category created successfully' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create category',
        variant: 'destructive',
      });
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, 'categories', id), { name });
      toast({ title: 'Success', description: 'Category updated successfully' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update category',
        variant: 'destructive',
      });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast({ title: 'Success', description: 'Category deleted successfully' });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete category',
        variant: 'destructive',
      });
    }
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}

/* ==================== DASHBOARD STATS ==================== */

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    companiesCount: 0,
    categoriesCount: 0,
    totalApplied: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    unsubscribers.push(
      onSnapshot(collection(db, 'jobs'), (snapshot) => {
        const jobs = snapshot.docs.map((d) => d.data() as Partial<Job>);

        setStats((prev) => ({
          ...prev,
          totalJobs: jobs.length,
          activeJobs: jobs.filter((j) => j.status === 'Active').length,
          totalApplied: jobs.reduce(
            (sum, j) => sum + (j.applied_count ?? 0),
            0
          ),
        }));
      })
    );

    unsubscribers.push(
      onSnapshot(collection(db, 'companies'), (snap) =>
        setStats((p) => ({ ...p, companiesCount: snap.size }))
      )
    );

    unsubscribers.push(
      onSnapshot(collection(db, 'categories'), (snap) => {
        setStats((p) => ({ ...p, categoriesCount: snap.size }));
        setLoading(false);
      })
    );

    return () => unsubscribers.forEach((u) => u());
  }, []);

  return { stats, loading };
}
