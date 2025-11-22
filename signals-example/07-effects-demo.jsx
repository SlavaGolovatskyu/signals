import { createSignal, createEffect, onCleanup, createComponent, render } from '../index.js';

export const EffectsDemo = createComponent(() => {
  const [name, setName] = createSignal('');
  const [count, setCount] = createSignal(0);
  const [logs, setLogs] = createSignal([]);

  const addLog = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    // Use functional updater to avoid creating dependency on logs signal
    setLogs(prevLogs => [...prevLogs, { message, type, timestamp }]);
  };

  // Effect that runs when name changes
  createEffect(() => {
    const currentName = name();
    addLog(`Effect: Name changed to "${currentName}"`, 'effect');
    
    // Cleanup function returned from effect (React-style)
    return () => {
      addLog(`Cleanup: Effect for "${currentName}" is cleaning up`, 'cleanup');
    };
  });

  // Effect using onCleanup
  createEffect(() => {
    if (count() > 0) {
      addLog(`Effect: Count is ${count()}, setting up interval`, 'effect');
      
      const interval = setInterval(() => {
        addLog(`Interval tick: count is ${count()}`, 'info');
      }, 2000);

      return () => {
        addLog(`Cleanup: Clearing interval for count ${count()}`, 'cleanup');
        clearInterval(interval);
      }; 
    }
  });

  // Component-level cleanup
  onCleanup(() => {
    addLog('Component unmounting - all cleanups will run', 'cleanup');
  });

  const currentCount = count();
  const currentName = name();
  const currentLogs = logs();

  const clearLogs = () => {
    setLogs([]);
  };
  
  console.log('RENDERING');

  return (
    <div>
      <div>
        <label>Name:</label>
        <input 
          type="text" 
          value={currentName} 
          oninput={(e) => setName(e.target.value)}
          placeholder="Type a name..."
        />
        <p>Current name: <strong>{currentName || '(empty)'}</strong></p>
      </div>

      <div>
        <label>Count:</label>
        <input 
          type="number" 
          value={currentCount} 
          oninput={(e) => setCount(parseInt(e.target.value) || 0)}
          placeholder="Enter a number"
        />
        <p>Current count: <strong>{currentCount}</strong></p>
        <button onclick={() => setCount(c => c + 1)}>Increment</button>
        <button onclick={() => setCount(0)}>Reset</button>
      </div>

      <div style="margin-top: 30px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3>Effect Logs:</h3>
          <button class="clear-btn" onclick={clearLogs}>Clear Logs</button>
        </div>
        <div class="log-box">
          {currentLogs.length === 0 ? (
            <p style="color: #999; text-align: center;">
              No logs yet. Change the name or count to see effects in action!
            </p>
          ) : (
            currentLogs.slice().reverse().map((log, index) => (
              <div key={index} class={`log-entry ${log.type}`}>
                <strong>[{log.timestamp}]</strong> {log.message}
              </div>
            ))
          )}
        </div>
        <p style="color: #666; font-size: 12px; margin-top: 10px;">
          <strong>Note:</strong> Open browser console to see additional debug logs. 
          Cleanups run when effects re-run or component unmounts.
        </p>
      </div>
    </div>
  );
});

render(EffectsDemo, document.getElementById('app'));

