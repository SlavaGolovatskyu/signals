import { setCurrentEffect, currentComponent } from '../reactive-context/reactive-context';

export function createEffect(fn) {
  const effect = () => {
    setCurrentEffect(effect);
    fn();
    setCurrentEffect(null);
  };

  // Register cleanup with current component
  if (currentComponent) {
    currentComponent._effects.push(effect);
  }

  effect();
  
  // Return cleanup function
  return () => {
    // This cleanup would need to unsubscribe from signals
    // For simplicity, we handle this at component level
  };
}