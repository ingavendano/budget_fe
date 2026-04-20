// src/app/landing/landing.ts
import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ElementRef,
  ChangeDetectorRef,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  planType: 'FREE' | 'PREMIUM' | 'PRO';
  price: number;
  durationDays: number;
  maxIncomeCategories: number | null;
  maxExpenseCategories: number | null;
  features: string[];
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingPageComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private el = inject(ElementRef);
  private cdr = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);

  plans = signal<SubscriptionPlan[]>([]);
  isLoadingPlans = signal(true);
  navScrolled = signal(false);
  mobileMenuOpen = signal(false);

  // Feature Card 1 — Diagnostic Shuffler
  shufflerItems = signal([
    { label: 'Presupuesto Mensual', value: '$3,450', delta: '+12%', icon: 'trending_up' },
    { label: 'Metas de Ahorro', value: '85%', delta: 'completado', icon: 'savings' },
    { label: 'Control de Deudas', value: '$1,200', delta: '-8% este mes', icon: 'credit_card' },
  ]);

  // Feature Card 2 — Typewriter
  typewriterMessages = [
    'Analizando flujo de caja...',
    'Proyección mensual generada.',
    'Meta de ahorro: 85% alcanzado.',
    'Deuda reducida un 8% este mes.',
    'Alerta: Gasto en entretenimiento +22%',
    'Recomendación: Reasigna $150 a inversión.',
  ];
  currentTypewriterText = signal('');
  typewriterLabel = signal('SISTEMA ACTIVO');

  // Feature Card 3 — Scheduler
  weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  activeDay = signal(-1);
  schedulerSaved = signal(false);

  // Private state
  private gsapCtx: any;
  private shufflerInterval: any;
  private typewriterInterval: any;
  private schedulerTimeout: any;
  private typewriterIndex = 0;
  private typewriterCharIndex = 0;
  private typewriterDeleting = false;
  private navObserver?: IntersectionObserver;

  readonly planIcons: Record<string, string> = {
    FREE: 'rocket_launch',
    PRO: 'workspace_premium',
    PREMIUM: 'diamond',
  };
  readonly planOrder: Record<string, number> = {
    FREE: 0,
    PRO: 1,
    PREMIUM: 2,
  };

  ngOnInit() {
    this.http.get<SubscriptionPlan[]>(`${environment.apiUrl}/auth/plans`).subscribe({
      next: (data) => {
        const sorted = [...data].sort(
          (a, b) => (this.planOrder[a.planType] ?? 9) - (this.planOrder[b.planType] ?? 9)
        );
        this.plans.set(sorted);
        this.isLoadingPlans.set(false);
      },
      error: () => {
        this.isLoadingPlans.set(false);
      },
    });

    this.startShuffler();
    this.startTypewriter();
    this.startSchedulerAnimation();
  }

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    this.initNavObserver();
    this.initGSAPAnimations();
  }

  ngOnDestroy() {
    if (this.gsapCtx) this.gsapCtx.revert();
    clearInterval(this.shufflerInterval);
    clearInterval(this.typewriterInterval);
    clearTimeout(this.schedulerTimeout);
    this.navObserver?.disconnect();
  }

  // ── Nav scroll morph ──────────────────────────────────────
  private initNavObserver() {
    const hero = this.el.nativeElement.querySelector('.hero-section');
    if (!hero) return;
    this.navObserver = new IntersectionObserver(
      ([entry]) => this.navScrolled.set(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    this.navObserver.observe(hero);
  }

  toggleMobileMenu() {
    this.mobileMenuOpen.set(!this.mobileMenuOpen());
  }

  // ── GSAP Animations ───────────────────────────────────────
  private async initGSAPAnimations() {
    const { gsap } = await import('gsap');
    const { ScrollTrigger } = await import('gsap/ScrollTrigger');
    gsap.registerPlugin(ScrollTrigger);

    this.gsapCtx = gsap.context(() => {
      // Hero stagger entrance
      gsap.from('.hero-animate', {
        y: 48,
        opacity: 0,
        duration: 1.1,
        stagger: 0.12,
        ease: 'power3.out',
        delay: 0.3,
      });

      // Features cards entrance
      gsap.from('.feature-card-animate', {
        scrollTrigger: { trigger: '.features-section', start: 'top 75%' },
        y: 60,
        opacity: 0,
        duration: 0.9,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // Philosophy word reveal
      const manifestoWords = this.el.nativeElement.querySelectorAll('.manifesto-word');
      if (manifestoWords.length) {
        gsap.from(manifestoWords, {
          scrollTrigger: { trigger: '.philosophy-section', start: 'top 65%' },
          y: 30,
          opacity: 0,
          duration: 0.7,
          stagger: 0.04,
          ease: 'power2.out',
        });
      }

      // Protocol cards stacking
      const protocolCards = this.el.nativeElement.querySelectorAll('.protocol-card');
      protocolCards.forEach((card: Element, i: number) => {
        if (i < protocolCards.length - 1) {
          ScrollTrigger.create({
            trigger: card,
            start: 'top top',
            end: () => `+=${protocolCards[i + 1]?.clientHeight || 600}`,
            pin: true,
            pinSpacing: false,
            onLeave: () => {
              gsap.to(card, { scale: 0.92, opacity: 0.5, filter: 'blur(4px)', duration: 0.4, ease: 'power2.inOut' });
            },
            onEnterBack: () => {
              gsap.to(card, { scale: 1, opacity: 1, filter: 'blur(0px)', duration: 0.4, ease: 'power2.inOut' });
            },
          });
        }
      });

      // Pricing cards entrance
      gsap.from('.pricing-card-animate', {
        scrollTrigger: { trigger: '.pricing-section', start: 'top 70%' },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // Final CTA
      gsap.from('.cta-final-animate', {
        scrollTrigger: { trigger: '.final-cta', start: 'top 80%' },
        scale: 0.95,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

    }, this.el.nativeElement);
  }

  // ── Interactive Cards ──────────────────────────────────────
  private startShuffler() {
    this.shufflerInterval = setInterval(() => {
      const arr = [...this.shufflerItems()];
      const last = arr.pop()!;
      arr.unshift(last);
      this.shufflerItems.set(arr);
    }, 3000);
  }

  private startTypewriter() {
    this.typewriterInterval = setInterval(() => {
      const fullText = this.typewriterMessages[this.typewriterIndex];
      if (this.typewriterDeleting) {
        this.typewriterCharIndex--;
        this.currentTypewriterText.set(fullText.slice(0, this.typewriterCharIndex));
        if (this.typewriterCharIndex === 0) {
          this.typewriterDeleting = false;
          this.typewriterIndex = (this.typewriterIndex + 1) % this.typewriterMessages.length;
        }
      } else {
        this.typewriterCharIndex++;
        this.currentTypewriterText.set(fullText.slice(0, this.typewriterCharIndex));
        if (this.typewriterCharIndex === fullText.length) {
          this.typewriterDeleting = true;
        }
      }
    }, 80);
  }

  private startSchedulerAnimation() {
    const runCycle = () => {
      this.activeDay.set(-1);
      this.schedulerSaved.set(false);
      let step = 0;
      const days = [1, 3, 5];
      const inner = setInterval(() => {
        if (step < days.length) {
          this.activeDay.set(days[step]);
          step++;
        } else {
          this.schedulerSaved.set(true);
          clearInterval(inner);
          this.schedulerTimeout = setTimeout(runCycle, 3000);
        }
      }, 800);
    };
    this.schedulerTimeout = setTimeout(runCycle, 1200);
  }

  isPro(plan: SubscriptionPlan): boolean {
    return plan.planType === 'PRO';
  }

  scrollTo(sectionId: string) {
    const element = document.getElementById(sectionId);
    if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}



