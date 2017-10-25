import { DemoRatingBasicComponent } from './demos/basic/basic';
import { DemoRatingCustomComponent } from './demos/custom/custom';
import { DemoRatingDynamicComponent } from './demos/dynamic/dynamic';

import { ContentSection } from '../../shared/models/content-section.model';
import { DemoTopSectionComponent } from '../../shared/demo-component/demo-top-section/index';
import { ExamplesComponent } from '../../shared/demo-component/demo-examples-section/index';
import { ApiSectionsComponent } from '../../shared/demo-component/demo-api-section/index';

export const demoComponentContent: ContentSection[] = [
  {
    name: 'Usage',
    anchor: 'usage',
    outlet: DemoTopSectionComponent,
    content: {
      doc: require('html-loader!markdown-loader!./docs/usage.md')
    }
  },
  {
    name: 'Examples',
    anchor: 'examples',
    outlet: ExamplesComponent,
    content: [
      {
        title: 'Static rating',
        anchor: 'rating-static',
        component: require('!!raw-loader?lang=typescript!./demos/basic/basic'),
        html: require('!!raw-loader?lang=markup!./demos/basic/basic.html'),
        outlet: DemoRatingBasicComponent
      },
      {
        title: 'Dynamic rating',
        anchor: 'rating-dynamic',
        component: require('!!raw-loader?lang=typescript!./demos/dynamic/dynamic'),
        html: require('!!raw-loader?lang=markup!./demos/dynamic/dynamic.html'),
        outlet: DemoRatingCustomComponent
      },
      {
        title: 'Custom icons',
        anchor: 'rating-custom',
        component: require('!!raw-loader?lang=typescript!./demos/custom/custom'),
        html: require('!!raw-loader?lang=markup!./demos/custom/custom.html'),
        outlet: DemoRatingDynamicComponent
      }
    ]
  },
  {
    name: 'API Reference',
    anchor: 'api-reference',
    outlet: ApiSectionsComponent,
    content: [
      {
        title: 'RatingComponent',
        anchor: 'rating-component'
      }
    ]
  }
];
