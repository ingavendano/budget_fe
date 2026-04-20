import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ConfigService, SavingsGoal } from '../../../features/config/config.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-savings-deposit',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './savings-deposit.component.html',
  styleUrl: './savings-deposit.component.scss'
})
export class SavingsDepositComponent implements OnInit {
  private configService = inject(ConfigService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  goal = signal<SavingsGoal | null>(null);
  amount = signal<number>(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadGoal(id);
    } else {
      this.router.navigate(['/savings-goals']);
    }
  }

  loadGoal(id: string) {
    this.loading.set(true);
    this.configService.getSavingsGoal(id).subscribe({
      next: data => {
        this.goal.set(data);
        this.loading.set(false);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo cargar la meta', 'error');
        this.router.navigate(['/savings-goals']);
      }
    });
  }

  confirm() {
    const publicId = this.goal()?.publicId;
    const depositAmount = this.amount();

    if (!publicId || depositAmount <= 0) {
      Swal.fire('Atención', 'Ingresa un monto válido para abonar', 'warning');
      return;
    }

    this.loading.set(true);
    this.configService.depositToGoal(publicId, depositAmount).subscribe({
      next: () => {
        Swal.fire({
          title: '¡Abono Exitoso!',
          text: `Has ahorrado $${depositAmount} en ${this.goal()?.name}`,
          icon: 'success',
          timer: 2000,
          showConfirmButton: false
        });
        this.router.navigate(['/savings-goals']);
      },
      error: () => {
        Swal.fire('Error', 'No se pudo registrar el abono', 'error');
        this.loading.set(false);
      }
    });
  }
}



