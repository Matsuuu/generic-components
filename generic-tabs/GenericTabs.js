import { KEYCODES } from '../utils/keycodes.js';

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: block;
    }

    div[role="tablist"] {
      display: flex;
    }
  </style>

  <div part="tablist" role="tablist">
    <slot name="tab"></slot>
  </div>

  <div part="panel">
    <slot name="panel"></slot>
  </div>
`;

/**
 * @element generic-tabs
 *
 * @csspart tablist
 * @csspart panel
 */
export class GenericTabs extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(template.content.cloneNode(true));

    this.__onTabClicked = this.__onTabClicked.bind(this);
    this.__onKeyDown = this.__onKeyDown.bind(this);
  }

  connectedCallback() {
    if (this.hasAttribute('selected')) {
      this.__index = Number(this.getAttribute('selected'));
    } else {
      this.__index = 0;
    }

    this.shadowRoot.addEventListener('slotchange', () => {
      this.__updateActive(false);
    });

    this.__tablist = this.shadowRoot.querySelector('div[role="tablist"]');
    this.__tablist.addEventListener('keydown', this.__onKeyDown);

    this.__tablist.setAttribute('aria-label', this.getAttribute('label') || 'tablist');
    this.__tablist.addEventListener('click', this.__onTabClicked);
  }

  static get observedAttributes() {
    return ['selected'];
  }

  // eslint-disable-next-line
  attributeChangedCallback(name, newVal, oldVal) {
    if (name === 'selected') {
      if (newVal !== oldVal) {
        this.__index = Number(this.getAttribute('selected'));
        this.__updateActive(true);
      }
    }
  }

  get selected() {
    return this.__index;
  }

  set selected(val) {
    this.__index = val;
    this.setAttribute('selected', this.__index);
  }

  __onKeyDown(event) {
    const tabs = this.__getTabs();

    switch (event.keyCode) {
      case KEYCODES.LEFT:
        if (this.__index === 0) {
          this.__index = tabs.length - 1;
        } else {
          this.__index--; // eslint-disable-line
        }
        event.preventDefault();
        break;

      case KEYCODES.RIGHT:
        if (this.__index === tabs.length - 1) {
          this.__index = 0;
        } else {
          this.__index++; // eslint-disable-line
        }
        event.preventDefault();
        break;

      case KEYCODES.HOME:
        this.__index = 0;
        break;

      case KEYCODES.END:
        this.__index = tabs.length - 1;
        break;
      default:
        return;
    }
    this.setAttribute('selected', this.__index);
    this.__focus();
  }

  __updateActive(shouldDispatchEvent) {
    const tabs = this.__getTabs();
    const panels = this.__getPanels();

    if (!tabs || !panels) return;
    tabs.forEach((_, i) => {
      if (i === this.__index) {
        this.setAttribute('selected', this.__index);
        tabs[i].setAttribute('selected', '');
        tabs[i].setAttribute('aria-selected', 'true');
        tabs[i].removeAttribute('tabindex');
        panels[i].removeAttribute('hidden');
        this.value = tabs[i].textContent.trim();
      } else {
        tabs[i].removeAttribute('selected');
        tabs[i].setAttribute('aria-selected', 'false');
        tabs[i].setAttribute('tabindex', '-1');
        panels[i].setAttribute('hidden', '');
      }

      tabs[i].setAttribute('role', 'tab');
      panels[i].setAttribute('role', 'tabpanel');

      tabs[i].id = `generic-tab-${i}`;
      tabs[i].setAttribute('aria-controls', `generic-tab-${i}`);
      panels[i].setAttribute('aria-labelledby', `generic-tab-${i}`);
    });

    if (shouldDispatchEvent) {
      const { __index } = this;
      this.dispatchEvent(
        new CustomEvent('selected-changed', {
          detail: __index,
        }),
      );
    }
  }

  __onTabClicked(e) {
    if (e.target.getAttribute('role') !== 'tab') return;
    this.__index = this.__getTabs().indexOf(e.target);
    this.setAttribute('selected', this.__index);
    this.__focus();
  }

  __focus() {
    const tabs = this.__getTabs();
    tabs[this.__index].focus();
  }

  __getTabs() {
    return [...this.querySelectorAll('[slot="tab"]')];
  }

  __getPanels() {
    return [...this.querySelectorAll('[slot="panel"]')];
  }
}
