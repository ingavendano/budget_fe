import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SeoService {
  private titleService = inject(Title);
  private metaService = inject(Meta);
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  public init() {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute),
      map(route => {
        while (route.firstChild) route = route.firstChild;
        return route;
      }),
      filter(route => route.outlet === 'primary'),
      mergeMap(route => route.data)
    ).subscribe(data => {
      const title = data['title'] || 'Nemía — Vive tus finanzas';
      const description = data['description'] || 'Gestiona, proyecta y audita tu patrimonio con una interfaz diseñada para la excelencia. Olvida las hojas de cálculo aburridas y abraza el futuro del presupuesto inteligente.';

      this.titleService.setTitle(title);
      this.metaService.updateTag({ name: 'description', content: description });

      // Open Graph Tags
      this.metaService.updateTag({ property: 'og:title', content: title });
      this.metaService.updateTag({ property: 'og:description', content: description });
      this.metaService.updateTag({ property: 'og:url', content: `https://Nemía.com${this.router.url}` });

      // Twitter Tags
      this.metaService.updateTag({ property: 'twitter:title', content: title });
      this.metaService.updateTag({ property: 'twitter:description', content: description });
    });
  }
}

