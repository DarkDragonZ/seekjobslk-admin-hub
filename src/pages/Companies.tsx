import { useState } from 'react';
import { Plus, Pencil, Trash2, Search, Building2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogDescription } from '@/components/ui/alert-dialog';
import { useCompanies } from '@/hooks/useFirestore';
import { Company } from '@/types';
import CompanyForm from '@/components/company/CompanyForm';

export default function Companies() {
  const { companies, loading, addCompany, updateCompany, deleteCompany } = useCompanies();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null);

  const filteredCompanies = companies.filter((company) =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (company.location?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
    (company.website?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
  );

  const handleOpenForm = (company?: Company) => {
    setEditingCompany(company ?? null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingCompany(null);
  };

  const handleSubmitForm = async (data: Omit<Company, 'id'>) => {
    if (editingCompany) {
      await updateCompany(editingCompany.id, data);
    } else {
      await addCompany(data);
    }
  };

  const handleDelete = async () => {
    if (deletingCompany) {
      await deleteCompany(deletingCompany.id);
      setDeletingCompany(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Companies</h1>
          <p className="text-muted-foreground mt-1">Manage registered companies</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="gap-2">
          <Plus className="w-4 h-4" />
          Add Company
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search companies..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Companies Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No companies found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredCompanies.map((company) => (
            <div key={company.id} className="bg-card rounded-xl border border-border p-3 card-hover">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                    {company.logo_url ? (
                      <img src={company.logo_url} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="font-medium text-card-foreground truncate">{company.name}</h3>
                    {company.website && (
                      <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-0.5">
                        Visit site
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {company.location && <p className="text-xs text-muted-foreground mt-0.5 truncate">{company.location}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenForm(company)} className="h-8 w-8">
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeletingCompany(company)} className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Company Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <CompanyForm company={editingCompany} open={isFormOpen} onClose={handleCloseForm} onSubmit={handleSubmitForm} />
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCompany} onOpenChange={() => setDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCompany?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
