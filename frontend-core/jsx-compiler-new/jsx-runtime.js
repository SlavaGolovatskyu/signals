/**
 * JSX Runtime - React-like JSX transformation target
 * 
 * This is the function that JSX syntax gets transformed to.
 * In React, JSX like <div>test</div> becomes React.createElement('div', null, 'test')
 * Here, it becomes jsx('div', null, 'test')
 * 
 * Usage (after Babel transformation):
 *   return (
 *     <button onclick={() => setCount(prev => prev + 1)}>
 *       {count()}
 *     </button>
 *   )
 * 
 * Gets transformed to:
 *   return jsx('button', { onclick: () => setCount(prev => prev + 1) }, count())
 */

export function jsx(type, props, ...children) {
  // Handle null/undefined children - flatten arrays and filter out falsy values
  const flatChildren = children.flat().filter(child => 
    child !== null && child !== undefined && child !== false
  );
    
    // Process props - handle class/className, event handlers, etc.
    const processedProps = props || {};
    const finalProps = {};
    
    // Determine if it's a component (capitalized) or HTML element
    const isComponent = typeof type === 'string' ? /^[A-Z]/.test(type) : typeof type === 'function';
    
    Object.keys(processedProps).forEach(key => {
      const value = processedProps[key];
      
      // Convert class to className for HTML elements (not components)
      // This matches React's behavior
      if (key === 'class' && !isComponent) {
        finalProps.className = value;
      }
      // Support both onclick and onClick - keep as onclick for compatibility
      // The component system expects onclick
      else if (key === 'onClick') {
        finalProps.onclick = value;
      }
      // Keep onclick as-is (this is what the system expects)
      else if (key === 'onclick') {
        finalProps.onclick = value;
      }
      // Keep other props as-is
      else {
        finalProps[key] = value;
      }
    });
    
  return {
    type,
    props: finalProps,
    children: flatChildren,
    isComponent
  };
}

/**
 * Fragment support - for JSX fragments like <>
 * Fragments are used when you want to return multiple elements without a wrapper
 */
export function Fragment(props) {
  // Extract children from props (JSX transform passes children as props.children)
  const children = props?.children || [];
  const flatChildren = Array.isArray(children) ? children.flat() : [children];
  
  return {
    type: Fragment,
    props: {},
    children: flatChildren.filter(child => 
      child !== null && child !== undefined && child !== false
    ),
    isComponent: false
  };
}

// jsxs is used for static children (optimization hint for JSX transform)
export function jsxs(type, props, ...children) {
  return jsx(type, props, ...children);
}

