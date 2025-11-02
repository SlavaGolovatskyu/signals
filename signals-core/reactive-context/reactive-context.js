export let currentEffect = null;
export let currentComponent = null;

export function setCurrentEffect(effect) {
  currentEffect = effect;
}

export function setCurrentComponent(component) {
  currentComponent = component;
}