import { setCurrentComponent } from '../../signals-core/reactive-context/reactive-context.js';
import { jsxCompiler } from '../jsx-compiler/jsx-compiler.js';

export function createComponent(ComponentFn) {
  return function(props = {}) {
    const instance = {
      _effects: [],
      _mounted: false,
      _element: null,
      _parentElement: null,
      _componentRegistry: {},
      
      registerComponent(name, component) {
        this._componentRegistry[name] = component;
      },
      
      mount(parentElement) {
        if (this._mounted) return;
        
        this._parentElement = parentElement;
        this._mounted = true;
        
        setCurrentComponent(this);
        
        this._element = this.render();
        
        setCurrentComponent(null);
        
        parentElement.appendChild(this._element);
      },
      
      unmount() {
        if (!this._mounted) return;
        
        this._effects.forEach(effect => {
          effect._disabled = true;
        });
        this._effects = [];
        
        if (this._element && this._element.parentNode) {
          this._element.parentNode.removeChild(this._element);
        }
        
        this._mounted = false;
        this._element = null;
      },
      
      render() {
        setCurrentComponent(this);
        
        const result = ComponentFn(props);
        
        setCurrentComponent(null);
        
        // If result is a string (HTML), compile it
        if (typeof result === 'string') {
          const vdom = jsxCompiler.compile(result);
          return this.createElement(vdom);
        }
        
        // Otherwise treat as JSX object
        return this.createElement(result);
      },
      
      rerender() {
        if (!this._mounted || !this._parentElement) return;
        
        const newElement = this.render();
        
        if (this._element && this._element.parentNode) {
          this._element.parentNode.replaceChild(newElement, this._element);
        }
        
        this._element = newElement;
      },
      
      createElement(vdom) {
        if (typeof vdom === 'string' || typeof vdom === 'number') {
          return document.createTextNode(String(vdom));
        }
        
        if (vdom == null || vdom === false) {
          return document.createTextNode('');
        }
        
        if (Array.isArray(vdom)) {
          const fragment = document.createDocumentFragment();
          vdom.forEach(child => {
            fragment.appendChild(this.createElement(child));
          });
          return fragment;
        }
        
        // Handle component instances
        if (vdom.isComponent) {
          const ComponentClass = this._componentRegistry[vdom.type];
          if (ComponentClass) {
            const childComponent = ComponentClass(vdom.props);
            const container = document.createElement('div');
            childComponent.mount(container);
            return container.firstChild;
          }
        }
        
        if (typeof vdom.type === 'function') {
          const childComponent = createComponent(vdom.type)(vdom.props);
          const container = document.createElement('div');
          childComponent.mount(container);
          return container.firstChild;
        }
        
        const element = document.createElement(vdom.type);
        
        Object.keys(vdom.props).forEach(key => {
          if (key === 'onClick' || key === 'onclick') {
            element.addEventListener('click', vdom.props[key]);
          } else if (key === 'className') {
            element.className = vdom.props[key];
          } else if (key === 'style' && typeof vdom.props[key] === 'object') {
            Object.assign(element.style, vdom.props[key]);
          } else if (key.startsWith('on')) {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, vdom.props[key]);
          } else {
            element.setAttribute(key, vdom.props[key]);
          }
        });
        
        vdom.children.forEach(child => {
          element.appendChild(this.createElement(child));
        });
        
        return element;
      }
    };
    
    return instance;
  };
}