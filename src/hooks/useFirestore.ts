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
  writeBatch
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { Job, Company, Category, DashboardStats } from '@/types';
import { toast } from '@/hooks/use-toast';

// Jobs Hook
export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'jobs'), orderBy('posted_date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Job[];
      setJobs(jobsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addJob = async (jobData: Omit<Job, 'id' | 'posted_date' | 'applied_count'>) => {
    try {
      const docRef = await addDoc(collection(db, 'jobs'), {
        ...jobData,
        posted_date: Timestamp.now(),
        applied_count: 0
      });
      toast({ title: 'Success', description: 'Job created successfully' });
      return docRef.id;
    } catch (error) {
      console.error('Error adding job:', error);
      toast({ title: 'Error', description: 'Failed to create job', variant: 'destructive' });
      return null;
    }
  };

  const updateJob = async (id: string, jobData: Partial<Job>) => {
    try {
      await updateDoc(doc(db, 'jobs', id), jobData);
      toast({ title: 'Success', description: 'Job updated successfully' });
    } catch (error) {
      console.error('Error updating job:', error);
      toast({ title: 'Error', description: 'Failed to update job', variant: 'destructive' });
    }
  };

  const deleteJob = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'jobs', id));
      toast({ title: 'Success', description: 'Job deleted successfully' });
    } catch (error) {
      console.error('Error deleting job:', error);
      toast({ title: 'Error', description: 'Failed to delete job', variant: 'destructive' });
    }
  };

  const deleteOldJobs = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoTimestamp = Timestamp.fromDate(thirtyDaysAgo);

      const q = query(
        collection(db, 'jobs'),
        where('posted_date', '<', thirtyDaysAgoTimestamp)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      
      toast({ 
        title: 'Success', 
        description: `Deleted ${snapshot.docs.length} jobs older than 30 days` 
      });
      
      return snapshot.docs.length;
    } catch (error) {
      console.error('Error deleting old jobs:', error);
      toast({ title: 'Error', description: 'Failed to delete old jobs', variant: 'destructive' });
      return 0;
    }
  };

  return { jobs, loading, addJob, updateJob, deleteJob, deleteOldJobs };
}

// Companies Hook
export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companiesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
      setCompanies(companiesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching companies:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCompany = async (companyData: Omit<Company, 'id'>) => {
    try {
      const docRef = await addDoc(collection(db, 'companies'), companyData);
      toast({ title: 'Success', description: 'Company created successfully' });
      return docRef.id;
    } catch (error) {
      console.error('Error adding company:', error);
      toast({ title: 'Error', description: 'Failed to create company', variant: 'destructive' });
      return null;
    }
  };

  const updateCompany = async (id: string, companyData: Partial<Company>) => {
    try {
      await updateDoc(doc(db, 'companies', id), companyData);
      toast({ title: 'Success', description: 'Company updated successfully' });
    } catch (error) {
      console.error('Error updating company:', error);
      toast({ title: 'Error', description: 'Failed to update company', variant: 'destructive' });
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'companies', id));
      toast({ title: 'Success', description: 'Company deleted successfully' });
    } catch (error) {
      console.error('Error deleting company:', error);
      toast({ title: 'Error', description: 'Failed to delete company', variant: 'destructive' });
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    try {
      const fileName = `logos/${Date.now()}_${file.name}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({ title: 'Error', description: 'Failed to upload logo', variant: 'destructive' });
      return null;
    }
  };

  return { companies, loading, addCompany, updateCompany, deleteCompany, uploadLogo };
}

// Categories Hook
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'categories'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const categoriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as Category[];
      setCategories(categoriesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching categories:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCategory = async (name: string) => {
    try {
      await addDoc(collection(db, 'categories'), { name });
      toast({ title: 'Success', description: 'Category created successfully' });
    } catch (error) {
      console.error('Error adding category:', error);
      toast({ title: 'Error', description: 'Failed to create category', variant: 'destructive' });
    }
  };

  const updateCategory = async (id: string, name: string) => {
    try {
      await updateDoc(doc(db, 'categories', id), { name });
      toast({ title: 'Success', description: 'Category updated successfully' });
    } catch (error) {
      console.error('Error updating category:', error);
      toast({ title: 'Error', description: 'Failed to update category', variant: 'destructive' });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'categories', id));
      toast({ title: 'Success', description: 'Category deleted successfully' });
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({ title: 'Error', description: 'Failed to delete category', variant: 'destructive' });
    }
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}

// Dashboard Stats Hook
export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    companiesCount: 0,
    categoriesCount: 0,
    totalApplied: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Jobs stats
    const jobsUnsubscribe = onSnapshot(collection(db, 'jobs'), (snapshot) => {
      const jobs = snapshot.docs.map(doc => doc.data());
      const activeJobs = jobs.filter(job => job.status === 'Active').length;
      const totalApplied = jobs.reduce((sum, job) => sum + (job.applied_count || 0), 0);
      
      setStats(prev => ({
        ...prev,
        totalJobs: jobs.length,
        activeJobs,
        totalApplied
      }));
    });
    unsubscribers.push(jobsUnsubscribe);

    // Companies count
    const companiesUnsubscribe = onSnapshot(collection(db, 'companies'), (snapshot) => {
      setStats(prev => ({ ...prev, companiesCount: snapshot.docs.length }));
    });
    unsubscribers.push(companiesUnsubscribe);

    // Categories count
    const categoriesUnsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setStats(prev => ({ ...prev, categoriesCount: snapshot.docs.length }));
      setLoading(false);
    });
    unsubscribers.push(categoriesUnsubscribe);

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, []);

  return { stats, loading };
}