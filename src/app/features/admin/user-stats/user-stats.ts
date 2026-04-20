import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfigService, AdminDashboardStatsDTO } from '../../config/config.service';

@Component({
  selector: 'app-user-stats',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './user-stats.html',
  styleUrl: './user-stats.css'
})
export class UserStatsComponent implements OnInit {
  private configService = inject(ConfigService);
  
  stats = signal<AdminDashboardStatsDTO | null>(null);
  
  planEntries = computed(() => {
    const s = this.stats();
    if (!s || !s.usersByPlan) return [];
    return Object.entries(s.usersByPlan).map(([key, value]) => ({ key, value }));
  });

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.configService.getAdminStats().subscribe({
      next: (data) => this.stats.set(data),
      error: (err) => console.error('Error loading admin stats:', err)
    });
  }
}
