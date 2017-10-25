import { ChangeDetectionStrategy, Component, Injector, ReflectiveInjector } from '@angular/core';

import { demoComponentContent } from './rating-section.list';
import { ContentSection } from '../../shared/models/content-section.model';

@Component({
  selector: 'rating-section',
  templateUrl: './rating-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RatingSectionComponent {
  name = 'Rating';
  src = 'https://github.com/valor-software/ngx-bootstrap/tree/development/src/rating';
  componentContent: ContentSection[] = demoComponentContent;
  content: any;

  _injectors = new Map<ContentSection, ReflectiveInjector>();

  constructor(private injector: Injector) { }

  sectionInjections(content: ContentSection) {
    if (this._injectors.has(content)) {
      return this._injectors.get(content);
    }

    const _injector = ReflectiveInjector.resolveAndCreate([
      {
        provide: ContentSection,
        useValue: content
      }], this.injector);

    this._injectors.set(content, _injector);

    return _injector;
  }
}
