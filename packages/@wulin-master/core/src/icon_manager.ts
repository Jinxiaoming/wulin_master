import { createIcons, icons } from 'lucide';

/**
 * IconManager handles the rendering of SVG icons using Lucide.
 * Replaces font-based Material Icons.
 */
export class IconManager {
  /**
   * Automatically scans the DOM for elements with data-lucide attribute
   * and replaces them with SVG icons.
   */
  static scan(scope: Element | Document = document) {
    createIcons({
      icons,
      nameAttr: 'data-lucide',
      attrs: {
        class: 'wulin-icon'
      }
    });
  }

  /**
   * Generates an SVG string for a specific icon.
   */
  static getIconHtml(name: string, attrs: Record<string, string> = {}) {
    const icon = icons[name as keyof typeof icons];
    if (!icon) return `<span class="icon-placeholder">${name}</span>`;
    
    // Create a temporary element to get the SVG string
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    // Basic Lucide attributes
    const defaultAttrs = {
      xmlns: 'http://www.w3.org/2000/svg',
      width: '24',
      height: '24',
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '2',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
      class: `lucide lucide-${name} wulin-icon ${attrs.class || ''}`
    };

    Object.entries({ ...defaultAttrs, ...attrs }).forEach(([k, v]) => {
      svg.setAttribute(k, v);
    });

    // Lucide icons are arrays of [tagName, attrs][]
    icon[2].forEach(([tagName, tagAttrs]) => {
      const el = document.createElementNS('http://www.w3.org/2000/svg', tagName);
      Object.entries(tagAttrs).forEach(([k, v]) => el.setAttribute(k, v as string));
      svg.appendChild(el);
    });

    return svg.outerHTML;
  }
}

export default IconManager;
