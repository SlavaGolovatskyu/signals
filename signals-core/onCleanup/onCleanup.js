import { currentComponent, currentEffect } from '../reactive-context/reactive-context.js';

export function onCleanup(fn) {
  if (!currentComponent) {
    throw new Error('onCleanup must be called within a component');
  }

  // Capture context at registration time
  const effect = currentEffect;
  const component = currentComponent;

  // If we're inside an effect, associate cleanup with that effect
  if (effect) {
    if (!effect._cleanups) {
      effect._cleanups = [];
    }
    effect._cleanups.push(fn);
  } else {
    // Otherwise, register as component-level cleanup
    if (!component._cleanups) {
      component._cleanups = [];
    }
    component._cleanups.push(fn);
  }

  // Return the cleanup function for manual removal if needed
  return () => {
    const cleanups = effect?._cleanups || component._cleanups;
    if (cleanups) {
      const index = cleanups.indexOf(fn);
      if (index > -1) {
        cleanups.splice(index, 1);
      }
    }
  };
}

