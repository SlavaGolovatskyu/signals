import { setCurrentEffect, currentComponent } from '../reactive-context/reactive-context.js';

export function createEffect(fn) {
  let cleanupFn = null;
  
  const effect = () => {
    // Run previous cleanup before re-running effect
    if (cleanupFn) {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Error in effect cleanup:', error);
      }
      cleanupFn = null;
    }
    
    // Clear any onCleanup callbacks from previous run
    if (effect._cleanups) {
      effect._cleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error in onCleanup callback:', error);
        }
      });
      effect._cleanups = [];
    }
    
    setCurrentEffect(effect);
    const result = fn();
    setCurrentEffect(null);
    
    // If the effect returns a cleanup function, store it
    if (typeof result === 'function') {
      cleanupFn = result;
    }
  };

  // Register cleanup with current component
  // Only create effect if effects haven't been initialized yet (first render only)
  if (currentComponent) {
    if (!currentComponent._effectsInitialized) {
      // First render - allow effect creation
      currentComponent._effects.push(effect);
      effect();
    } else {
      // Subsequent renders - effects already exist, don't create new ones
      // Just return a no-op cleanup function
      return () => {};
    }
  } else {
    // Not in component context - create effect normally
    effect();
  }
  
  // Return cleanup function
  return () => {
    // Run cleanup function
    if (cleanupFn) {
      try {
        cleanupFn();
      } catch (error) {
        console.error('Error in effect cleanup:', error);
      }
      cleanupFn = null;
    }
    
    // Run all onCleanup callbacks
    if (effect._cleanups) {
      effect._cleanups.forEach(cleanup => {
        try {
          cleanup();
        } catch (error) {
          console.error('Error in onCleanup callback:', error);
        }
      });
      effect._cleanups = [];
    }
    
    // Disable the effect
    effect._disabled = true;
  };
}