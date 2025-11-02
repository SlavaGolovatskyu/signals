import { currentEffect } from '../reactive-context/reactive-context';

export function createSignal(initialValue) {
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
    subscribers.forEach(effect => effect());
  };

  return [read, write];
}