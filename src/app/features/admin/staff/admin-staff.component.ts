import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { AuthService, StaffUser } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-staff',
  standalone: true,
  imports: [FormsModule, TitleCasePipe],
  host: { class: 'flex flex-col flex-1 min-h-0' },
  templateUrl: './admin-staff.component.html',
})
export class AdminStaffComponent implements OnInit {
  private authService = inject(AuthService);

  staff = signal<StaffUser[]>([]);
  loading = signal(true);
  searchQuery = signal('');
  activeRoleFilter = signal('all');
  toast = signal<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modal state
  showModal = signal(false);
  editingStaff = signal<StaffUser | null>(null);
  formName = signal('');
  formEmail = signal('');
  formPassword = signal('');
  formRole = signal('receptionist');
  formPhone = signal('');
  formSaving = signal(false);

  roles = ['admin', 'manager', 'kitchen', 'receptionist'];
  roleFilters = [
    { key: 'all', label: 'All Members' },
    { key: 'admin', label: 'Admins' },
    { key: 'manager', label: 'Managers' },
    { key: 'kitchen', label: 'Kitchen' },
    { key: 'receptionist', label: 'Front Desk' },
  ];

  filteredStaff = computed(() => {
    let list = this.staff();
    const role = this.activeRoleFilter();
    const q = this.searchQuery().toLowerCase().trim();

    if (role !== 'all') list = list.filter(s => s.role === role);
    if (q) list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q)
    );
    return list;
  });

  stats = computed(() => {
    const all = this.staff();
    return {
      total: all.length,
      active: all.filter(s => s.isActive !== false).length,
      inactive: all.filter(s => s.isActive === false).length,
      roles: {
        admin: all.filter(s => s.role === 'admin').length,
        manager: all.filter(s => s.role === 'manager').length,
        kitchen: all.filter(s => s.role === 'kitchen').length,
        receptionist: all.filter(s => s.role === 'receptionist').length,
      }
    };
  });

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
    this.loading.set(true);
    this.authService.getAllStaff().subscribe({
      next: staff => { this.staff.set(staff); this.loading.set(false); },
      error: () => { this.loading.set(false); this.showToast('Failed to load staff', 'error'); },
    });
  }

  openCreateModal() {
    this.editingStaff.set(null);
    this.formName.set('');
    this.formEmail.set('');
    this.formPassword.set('');
    this.formRole.set('receptionist');
    this.formPhone.set('');
    this.showModal.set(true);
  }

  openEditModal(s: StaffUser) {
    this.editingStaff.set(s);
    this.formName.set(s.name);
    this.formEmail.set(s.email);
    this.formPassword.set('');
    this.formRole.set(s.role);
    this.formPhone.set(s.phone || '');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingStaff.set(null);
  }

  saveStaff() {
    if (!this.formName().trim() || !this.formEmail().trim() || !this.formRole()) return;
    this.formSaving.set(true);

    const editing = this.editingStaff();
    if (editing) {
      // Update
      const data: any = {
        name: this.formName().trim(),
        role: this.formRole(),
        phone: this.formPhone(),
      };
      if (this.formPassword()) data.password = this.formPassword();
      this.authService.updateStaff(editing._id, data).subscribe({
        next: () => { this.formSaving.set(false); this.closeModal(); this.loadStaff(); this.showToast('Staff updated', 'success'); },
        error: () => { this.formSaving.set(false); this.showToast('Failed to update', 'error'); },
      });
    } else {
      // Create
      if (!this.formPassword()) { this.formSaving.set(false); return; }
      this.authService.registerStaff({
        name: this.formName().trim(),
        email: this.formEmail().trim(),
        password: this.formPassword(),
        role: this.formRole(),
        phone: this.formPhone(),
      }).subscribe({
        next: () => { this.formSaving.set(false); this.closeModal(); this.loadStaff(); this.showToast('Staff created', 'success'); },
        error: (err) => {
          this.formSaving.set(false);
          this.showToast(err.error?.error || 'Failed to create staff', 'error');
        },
      });
    }
  }

  toggleActive(s: StaffUser) {
    const newStatus = s.isActive === false ? true : false;
    this.authService.updateStaff(s._id, { isActive: newStatus }).subscribe({
      next: () => { this.loadStaff(); this.showToast(`Staff ${newStatus ? 'activated' : 'deactivated'}`, 'success'); },
      error: () => this.showToast('Failed to update status', 'error'),
    });
  }

  toggleMfa(s: StaffUser) {
    const newValue = !s.mfaRequired;
    this.authService.updateStaff(s._id, { mfaRequired: newValue }).subscribe({
      next: () => {
        this.loadStaff();
        this.showToast(`2FA ${newValue ? 'enabled' : 'disabled'} for ${s.name}`, 'success');
      },
      error: () => this.showToast('Failed to update 2FA setting', 'error'),
    });
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700';
      case 'manager': return 'bg-blue-100 text-blue-700';
      case 'kitchen': return 'bg-primary/10 text-primary';
      case 'receptionist': return 'bg-gray-100 text-gray-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  private showToast(message: string, type: 'success' | 'error') {
    this.toast.set({ message, type });
    setTimeout(() => this.toast.set(null), 3000);
  }
}
