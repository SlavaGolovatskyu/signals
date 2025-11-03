import { setCurrentComponent } from '../../signals-core/reactive-context/reactive-context.js';
import { createEffect } from '../../signals-core/createEffect/createEffect.js';
import { jsxCompiler } from '../jsx-compiler/jsx-compiler.js';
import { componentSignalRegistry } from '../../signals-core/createSignal/createSignal.js';

export function createComponent(ComponentFn) {
  return function(props = {}) {
    // Execute ComponentFn once to create signals and initial template
    // Store the result so signals persist in the closure
    let componentTemplate = null;
    let isInitialized = false;
    
    const instance = {
      _effects: [],
      _cleanups: [],
      _mounted: false,
      _element: null,
      _parentElement: null,
      _componentRegistry: {},
      _componentFn: ComponentFn, // Store reference to component function
      _props: props, // Store props
      _renderCount: 0, // Track render count for signal reuse
      
      registerComponent(name, component) {
        this._componentRegistry[name] = component;
      },
      
      mount(parentElement) {
        if (this._mounted) return;
        
        this._parentElement = parentElement;
        this._mounted = true;
        
        setCurrentComponent(this);
        
        // Set up reactive re-rendering with an effect that tracks dependencies
        let isFirstRun = true;
        createEffect(() => {
          // Track signals by calling render (which reads signals)
          // This establishes dependencies on signals used in the template
          if (this._mounted) {
            // Call render to track dependencies and re-render if needed
            const newElement = this.render();
            
            // On first run, mount the element. On subsequent runs, replace it.
            if (isFirstRun) {
              this._element = newElement;
              parentElement.appendChild(this._element);
            } else {
              if (this._element && this._element.parentNode) {
                // Preserve focus during re-render
                const activeElement = document.activeElement;
                let focusInfo = null;
                
                if (activeElement && this._element.contains(activeElement)) {
                  // Build a selector path to find the element after re-render
                  const path = [];
                  let current = activeElement;
                  
                  while (current && current !== this._element) {
                    const parent = current.parentElement;
                    if (parent) {
                      // Try to build a unique selector
                      let selector = current.tagName.toLowerCase();
                      
                      if (current.id) {
                        selector = `#${current.id}`;
                        path.unshift(selector);
                        break; // ID is unique, we can stop here
                      } else if (current.name) {
                        selector += `[name="${current.name}"]`;
                      } else if (current.type) {
                        selector += `[type="${current.type}"]`;
                      }
                      
                      // Add position index
                      const siblings = Array.from(parent.children).filter(
                        child => child.tagName === current.tagName
                      );
                      const index = siblings.indexOf(current);
                      if (index > 0) {
                        selector += `:nth-of-type(${index + 1})`;
                      }
                      
                      path.unshift(selector);
                    }
                    current = parent;
                  }
                  
                  focusInfo = {
                    selector: path.join(' > '),
                    selectionStart: activeElement.selectionStart,
                    selectionEnd: activeElement.selectionEnd,
                    tagName: activeElement.tagName
                  };
                }
                
                this._element.parentNode.replaceChild(newElement, this._element);
                
                // Restore focus if element was focused
                if (focusInfo) {
                  setTimeout(() => {
                    let newActiveElement = null;
                    
                    // Try ID first (most reliable)
                    if (focusInfo.selector.includes('#')) {
                      const idMatch = focusInfo.selector.match(/#([\w-]+)/);
                      if (idMatch) {
                        newActiveElement = newElement.querySelector(`#${idMatch[1]}`);
                      }
                    }
                    
                    // Fallback to full selector path
                    if (!newActiveElement && focusInfo.selector) {
                      newActiveElement = newElement.querySelector(focusInfo.selector);
                    }
                    
                    // Fallback: find by tag and type if it's an input
                    if (!newActiveElement && activeElement.tagName === 'INPUT') {
                      const inputs = newElement.querySelectorAll('input[type="' + activeElement.type + '"]');
                      if (inputs.length === 1) {
                        newActiveElement = inputs[0];
                      }
                    }
                    
                    if (newActiveElement && newActiveElement.tagName === focusInfo.tagName) {
                      newActiveElement.focus();
                      // Restore cursor position for inputs/textareas
                      if (newActiveElement.setSelectionRange && 
                          focusInfo.selectionStart !== null && 
                          focusInfo.selectionEnd !== null) {
                        newActiveElement.setSelectionRange(
                          focusInfo.selectionStart, 
                          focusInfo.selectionEnd
                        );
                      }
                    }
                  }, 0);
                }
              }
              this._element = newElement;
            }
          }
          isFirstRun = false;
        });
        setCurrentComponent(null);
      },
      
      unmount() {
        if (!this._mounted) return;
        
        // Run all component-level cleanups
        if (this._cleanups) {
          this._cleanups.forEach(cleanup => {
            try {
              cleanup();
            } catch (error) {
              console.error('Error in component cleanup:', error);
            }
          });
          this._cleanups = [];
        }
        
        // Disable and clean up effects (effects handle their own cleanups)
        this._effects.forEach(effect => {
          // Run effect cleanup if it exists
          if (effect._cleanups) {
            effect._cleanups.forEach(cleanup => {
              try {
                cleanup();
              } catch (error) {
                console.error('Error in effect cleanup:', error);
              }
            });
          }
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
        
        // Increment render count so createSignal can detect re-renders
        this._renderCount++;
        
        // Reset signal index for this render cycle
        // createSignal will track which signal we're on
        if (componentSignalRegistry.has(this)) {
          componentSignalRegistry.get(this).index = 0;
        }
        
        // Execute ComponentFn - createSignal will reuse existing signals on re-renders
        const result = this._componentFn(this._props);
        
        setCurrentComponent(null);
        
        // If result is an object with html property (from html template), compile it
        if (result && typeof result === 'object' && result.html) {
          // Store function map for this render
          this._currentFunctions = result.functions;
          console.log('[component] render - functions map:', {
            size: result.functions.size,
            keys: Array.from(result.functions.keys()),
            functions: Array.from(result.functions.entries()).map(([k, v]) => [k, typeof v])
          });
          const vdom = jsxCompiler.compile(result.html);
          console.log('[component] Compiled VDOM, looking for onclick attributes...');
          // Helper to traverse VDOM
          const traverseVdom = (node, callback) => {
            if (Array.isArray(node)) {
              node.forEach(child => traverseVdom(child, callback));
            } else if (node && typeof node === 'object' && node.props) {
              callback(node);
              if (node.children) {
                node.children.forEach(child => traverseVdom(child, callback));
              }
            }
          };
          traverseVdom(vdom, (node) => {
            if (node.props && node.props.onclick) {
              console.log('[component] Found onclick in VDOM:', {
                elementType: node.type,
                onclickValue: node.props.onclick,
                onclickType: typeof node.props.onclick,
                isPlaceholder: typeof node.props.onclick === 'string' && node.props.onclick.startsWith('__func_'),
                inFunctionsMap: this._currentFunctions && this._currentFunctions.has(node.props.onclick)
              });
            }
          });
          
          // Functions from nested html templates are already merged by html() function
          const element = this.createElement(vdom);
          return element;
        }
        
        // If result is a string (HTML), compile it
        if (typeof result === 'string') {
          this._currentFunctions = null;
          const vdom = jsxCompiler.compile(result);
          return this.createElement(vdom);
        }
        
        // Otherwise treat as JSX object
        return this.createElement(result);
      },
      
      rerender() {
        if (!this._mounted || !this._parentElement) return;
        
        // Re-render with fresh functions map
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
          let value = vdom.props[key];
          
          // Check if value is a function placeholder and look it up
          if (typeof value === 'string' && value.startsWith('__func_') && value.endsWith('__')) {
            if (this._currentFunctions && this._currentFunctions.has(value)) {
              value = this._currentFunctions.get(value);
            } else {
              // If function not found, log and skip this attribute to avoid errors
              console.warn(`[createElement] Function placeholder "${value}" not found in functions map.`, {
                key,
                availableKeys: this._currentFunctions ? Array.from(this._currentFunctions.keys()) : 'none',
                elementType: vdom.type,
                allProps: Object.keys(vdom.props)
              });
              return;
            }
          }
          
          if (key === 'onClick' || key === 'onclick') {
            if (typeof value === 'function') {
              element.addEventListener('click', value);
            } else {
              console.warn(`[createElement] onclick handler is not a function:`, { key, value, valueType: typeof value });
            }
          } else if (key === 'className') {
            element.className = value;
          } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
          } else if (key.startsWith('on') && typeof value === 'function') {
            const eventName = key.slice(2).toLowerCase();
            element.addEventListener(eventName, value);
          } else if (key.startsWith('on') && typeof value !== 'function') {
            // Don't set non-function event handlers as attributes
            return;
          } else {
            element.setAttribute(key, value);
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