import { currentEffect, currentComponent } from '../reactive-context/reactive-context.js';

// Track signal creation order per component to reuse signals across renders
export const componentSignalRegistry = new WeakMap();

export function createSignal(initialValue) {
  // If we're in a component context, check if we should reuse an existing signal
  if (currentComponent) {
    if (!componentSignalRegistry.has(currentComponent)) {
      componentSignalRegistry.set(currentComponent, { signals: [], index: 0 });
    }
    const registry = componentSignalRegistry.get(currentComponent);
    
    // Check if this is a re-render and we should reuse the signal
    if (currentComponent._renderCount > 1 && registry.signals[registry.index]) {
      // Reuse existing signal at current index
      const signal = registry.signals[registry.index];
      registry.index++; // Move to next signal index
      return signal;
    }
    
    // Create new signal
    let value = initialValue;
    const subscribers = new Set();

    const read = () => {
      if (currentEffect) {
        subscribers.add(currentEffect);
      }
      return value;
    };

    const write = (newValue) => {
      value = typeof newValue === 'function' ? newValue(value) : newValue;
      // Call all subscribers (effects) to trigger re-renders
      subscribers.forEach(effect => {
        if (!effect._disabled) {
          effect();
        }
      });
    };

    const signal = [read, write];
    registry.signals.push(signal);
    registry.index++; // Move to next signal index for next call
    return signal;
  }
  
  // Not in component context - create signal normally
  let value = initialValue;
  const subscribers = new Set();

  const read = () => {
    if (currentEffect) {
      subscribers.add(currentEffect);
    }
    return value;
  };

  const write = (newValue) => {
    value = typeof newValue === 'function' ? newValue(value) : newValue;
    // Call all subscribers (effects) to trigger re-renders
    subscribers.forEach(effect => {
      if (!effect._disabled) {
        effect();
      }
    });
  };

  return [read, write];
}