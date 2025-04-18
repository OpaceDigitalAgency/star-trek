class ProgressiveImage extends HTMLElement {
  static get observedAttributes() {
    return ['src', 'alt', 'fallback', 'class'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._img = null;
    this._loading = true;
    this._error = false;
    this._src = '';
    this._alt = '';
    this._fallback = '/images/stars-placeholder.jpg';
    this._class = '';
  }

  connectedCallback() {
    this._src = this.getAttribute('src') || '';
    this._alt = this.getAttribute('alt') || '';
    this._fallback = this.getAttribute('fallback') || '/images/stars-placeholder.jpg';
    this._class = this.getAttribute('class') || '';
    this.render();
    this.loadImage();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      if (name === 'src') this._src = newValue;
      if (name === 'alt') this._alt = newValue;
      if (name === 'fallback') this._fallback = newValue;
      if (name === 'class') this._class = newValue;
      this.render();
      this.loadImage();
    }
  }

  loadImage() {
    this._loading = true;
    this._error = false;
    this.render();

    if (!this._src) {
      this._error = true;
      this._loading = false;
      this.render();
      return;
    }

    const img = new window.Image();
    img.src = this._src;
    img.onload = () => {
      this._loading = false;
      this._error = false;
      this.render();
    };
    img.onerror = () => {
      console.warn(`Failed to load image: ${this._src}, falling back to: ${this._fallback}`);
      this._loading = false;
      this._error = true;
      this.render();
      
      // Try to load the fallback image
      if (this._fallback && this._fallback !== this._src) {
        const fallbackImg = new window.Image();
        fallbackImg.src = this._fallback;
      }
    };
  }

  render() {
    const style = `
      <style>
        .wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: block;
        }
        .skeleton, .spinner {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          width: 100%; height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #222c38;
          z-index: 1;
        }
        .skeleton {
          background: linear-gradient(90deg, #222c38 25%, #2a3442 50%, #222c38 75%);
          background-size: 200% 100%;
          animation: skeleton-loading 1.2s infinite linear;
        }
        @keyframes skeleton-loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .spinner {
          z-index: 2;
        }
        .img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          opacity: ${this._loading ? 0 : 1};
          transition: opacity 0.3s;
        }
        .fallback {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
      </style>
    `;

    let content = `<div class="wrapper" aria-busy="${this._loading}" aria-live="polite">`;

    if (this._loading) {
      content += `<div class="skeleton" role="status" aria-label="Loading image"></div>`;
    }

    if (this._error) {
      content += `<img src="${this._fallback}" alt="${this._alt}" class="fallback ${this._class}" />`;
    } else {
      content += `<img src="${this._src}" alt="${this._alt}" class="img ${this._class}" style="opacity:${this._loading ? 0 : 1};" />`;
    }

    content += `</div>`;

    this.shadowRoot.innerHTML = style + content;
  }
}

if (!window.customElements.get('progressive-image')) {
  window.customElements.define('progressive-image', ProgressiveImage);
}