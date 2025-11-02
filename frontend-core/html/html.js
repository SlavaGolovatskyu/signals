export function html(strings, ...values) {
  let htmlString = '';
  
  strings.forEach((str, i) => {
    htmlString += str;
    if (i < values.length) {
      const value = values[i];
      
      // Handle functions (event handlers)
      if (typeof value === 'function') {
        // Store function reference and use placeholder
        const funcId = `__func_${i}__`;
        htmlString += funcId;
      } else {
        htmlString += value;
      }
    }
  });
  
  return htmlString;
}