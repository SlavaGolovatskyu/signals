# Reactive Component System

A lightweight, React-like component system with signals-based reactivity and full JSX support.

## Features

- 🎯 **Reactive Signals** - Automatic dependency tracking like SolidJS
- 🔄 **Auto Cleanup** - Effects are cleaned up on component unmount
- ⚛️ **JSX Support** - Write components using React-like JSX syntax
- 📝 **HTML Templates** - Also supports HTML template literals for simple cases
- 🧩 **Component Composition** - Nest components naturally
- 🪶 **Zero Dependencies** - Pure vanilla JavaScript (build tool needed for JSX)

## Installation

```bash
# Clone or copy the files to your project
npm install  # Install Vite for JSX support (optional but recommended)
```

### Setup for JSX

To use JSX syntax, you need a build tool. Vite is recommended:

1. Install dependencies: `npm install`
2. Start dev server: `npm run dev`
3. Write JSX in `.jsx` files

See [SETUP.md](./SETUP.md) for detailed setup instructions.

## Quick Start

### With JSX (Recommended)

```javascript
import { createSignal, createComponent, render } from './index.js';

// Create a simple counter with JSX
const Counter = createComponent((props) => {
  const [count, setCount] = createSignal(props.initialCount || 0);

  return (
    <div>
      <h2>Count: {count()}</h2>
      <button onclick={() => setCount(count() + 1)}>Increment</button>
    </div>
  );
});

// Render it
render(Counter, document.getElementById('app'), { initialCount: 0 });
```

**Note:** JSX requires a build tool (Vite recommended). See [SETUP.md](./SETUP.md) for setup instructions.

### With HTML Templates (No Build Tool)

```javascript
import { createSignal, createComponent, render, html } from './index.js';

// Create a simple counter with HTML templates
const Counter = createComponent((props) => {
  const [count, setCount] = createSignal(props.initialCount || 0);

  return html`
    <div>
      <h2>Count: ${count()}</h2>
      <button onclick="${() => setCount(count() + 1)}">Increment</button>
    </div>
  `;
});

// Render it
render(Counter, document.getElementById('app'), { initialCount: 0 });
```

## Core API

### `createSignal(initialValue)`

Creates a reactive value that triggers updates when changed.

```javascript
const [count, setCount] = createSignal(0);

console.log(count()); // 0
setCount(5);
console.log(count()); // 5

// Updater function
setCount(prev => prev + 1);
```

### `createEffect(fn)`

Runs a function that automatically tracks dependencies and re-runs when they change.

```javascript
const [count, setCount] = createSignal(0);

createEffect(() => {
  console.log('Count is:', count());
});

setCount(1); // Logs: "Count is: 1"
```

### `createMemo(fn)`

Creates a computed value that updates when dependencies change.

```javascript
const [price, setPrice] = createSignal(100);
const [quantity, setQuantity] = createSignal(2);

const total = createMemo(() => price() * quantity());

console.log(total()); // 200
setPrice(150);
console.log(total()); // 300
```

### `createComponent(fn)`

Creates a component with automatic effect cleanup.

```javascript
const MyComponent = createComponent((props) => {
  // Component logic here
  
  return html`
    <div>${props.message}</div>
  `;
});
```

### JSX Syntax

Write components using React-like JSX syntax (requires build tool).

```javascript
return (
  <div class="container">
    <h1>{title()}</h1>
    {showContent() && <p>Content here</p>}
  </div>
);
```

### `html` Template Literal

Alternative syntax using HTML template literals (no build tool needed).

```javascript
return html`
  <div class="container">
    <h1>${title()}</h1>
    ${showContent() ? '<p>Content here</p>' : ''}
  </div>
`;
```

## Examples

All examples use JSX syntax. See the `signals-example/` directory for complete working examples.

### 1. Reusable Button Component

```javascript
const Button = createComponent((props) => {
  return (
    <button 
      style={`padding: 10px 20px; cursor: pointer; background: ${props.color || '#007bff'}; color: white; border: none; border-radius: 4px; margin: 5px;`}
      onclick={props.onClick}
    >
      {props.label || 'Click me'}
    </button>
  );
});

// Usage
<Button label="Submit" color="#28a745" onClick={() => console.log('clicked')} />
```

### 2. Card Wrapper Component

```javascript
const Card = createComponent((props) => {
  return (
    <div 
      style={`padding: 20px; border: 2px solid ${props.borderColor || '#007bff'}; border-radius: 8px; margin: 10px; background: white;`}
    >
      <h3 style={`margin-top: 0; color: ${props.borderColor || '#007bff'};`}>
        {props.title}
      </h3>
      <div>{props.children || 'No content'}</div>
    </div>
  );
});

// Usage
<Card title="My Card" borderColor="#28a745">
  <p>Card content goes here</p>
</Card>
```

### 3. Counter with Effects

```javascript
const Counter = createComponent((props) => {
  const [count, setCount] = createSignal(props.initialCount || 0);
  const [message, setMessage] = createSignal('');

  createEffect(() => {
    if (count() >= 10) {
      setMessage('Wow, that\'s a lot!');
    } else if (count() >= 5) {
      setMessage('Getting there!');
    } else {
      setMessage('');
    }
  });

  return (
    <div style="font-family: Arial;">
      <h2>Counter: {count()}</h2>
      <p style="font-size: 24px; font-weight: bold; color: #333;">
        Count: {count()}
      </p>
      {message() && (
        <p style="color: green; font-weight: bold;">{message()}</p>
      )}
      
      <div style="margin-top: 10px;">
        <Button label="Increment +1" color="#28a745" onClick={() => setCount(c => c + 1)} />
        <Button label="Increment +5" color="#17a2b8" onClick={() => setCount(c => c + 5)} />
        <Button label="Reset" color="#dc3545" onClick={() => setCount(0)} />
      </div>
    </div>
  );
});
```

### 4. Timer with Auto-Increment

```javascript
const Timer = createComponent(() => {
  const [seconds, setSeconds] = createSignal(0);
  const [isRunning, setIsRunning] = createSignal(true);

  createEffect(() => {
    if (!isRunning()) return;
    
    const interval = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    
    // Cleanup happens automatically on unmount
    return () => clearInterval(interval);
  });

  return (
    <div style="text-align: center;">
      <h3>Timer</h3>
      <p style="font-size: 36px; font-weight: bold; color: #007bff;">
        {seconds()}s
      </p>
      <Button 
        label={isRunning() ? 'Pause' : 'Start'} 
        color={isRunning() ? '#ffc107' : '#28a745'}
        onClick={() => setIsRunning(!isRunning())}
      />
      <Button label="Reset" color="#dc3545" onClick={() => setSeconds(0)} />
    </div>
  );
});
```

### 5. Dashboard with Multiple Components

```javascript
const Dashboard = createComponent(() => {
  const [showTimer, setShowTimer] = createSignal(true);
  const [showCounter, setShowCounter] = createSignal(true);

  return (
    <div style="padding: 20px; max-width: 1200px; margin: 0 auto; background: #f5f5f5;">
      <h1 style="color: #333; text-align: center;">Component Dashboard</h1>
      <p style="text-align: center; color: #666;">
        Nested components with JSX!
      </p>
      
      <div style="display: flex; gap: 20px; margin-top: 20px;">
        <div style="flex: 1;">
          <Card title="Counter Widget" borderColor="#007bff">
            {showCounter() ? (
              <Counter initialCount={0} />
            ) : (
              <p style="color: #999;">Counter hidden</p>
            )}
          </Card>
          <Button 
            label={showCounter() ? 'Hide Counter' : 'Show Counter'} 
            color="#6c757d"
            onClick={() => setShowCounter(!showCounter())}
          />
        </div>
        
        <div style="flex: 1;">
          <Card title="Timer Widget" borderColor="#28a745">
            {showTimer() ? (
              <Timer />
            ) : (
              <p style="color: #999;">Timer hidden</p>
            )}
          </Card>
          <Button 
            label={showTimer() ? 'Hide Timer' : 'Show Timer'} 
            color="#6c757d"
            onClick={() => setShowTimer(!showTimer())}
          />
        </div>
      </div>
      
      <Card title="Info Section" borderColor="#ffc107">
        <p>This dashboard demonstrates nested components:</p>
        <ul style="line-height: 1.8;">
          <li><strong>Button</strong> - Reusable button component</li>
          <li><strong>Card</strong> - Container wrapper component</li>
          <li><strong>Counter</strong> - Stateful counter with buttons</li>
          <li><strong>Timer</strong> - Auto-incrementing timer</li>
        </ul>
      </Card>
    </div>
  );
});

// Render the dashboard
render(Dashboard, document.getElementById('app'));
```

### 6. Dynamic List Rendering

```javascript
const UserList = createComponent(() => {
  const [users] = createSignal([
    { id: 1, name: 'Alice', role: 'Admin' },
    { id: 2, name: 'Bob', role: 'User' },
    { id: 3, name: 'Charlie', role: 'Moderator' }
  ]);

  return (
    <div>
      <h2>User List</h2>
      {users().map(user => (
        <Card key={user.id} title={user.name} borderColor="#6610f2">
          <p><strong>Role:</strong> {user.role}</p>
          <Button label="View Profile" color="#007bff" />
          <Button label="Send Message" color="#28a745" />
        </Card>
      ))}
    </div>
  );
});
```

## Advanced Usage

### Conditional Rendering

```javascript
return (
  <div>
    {isLoggedIn() ? <Dashboard /> : <Login />}
  </div>
);
```

### Loops and Mapping

```javascript
return (
  <ul>
    {items().map(item => (
      <li key={item.id}>{item.name}</li>
    ))}
  </ul>
);
```

### Event Handling

```javascript
const handleClick = () => {
  console.log('Clicked!');
};

return (
  <button onclick={handleClick}>Click me</button>
);
```

### Component Composition

```javascript
const App = createComponent(() => {
  return (
    <div>
      <Header />
      <Main>
        <Sidebar />
        <Content />
      </Main>
      <Footer />
    </div>
  );
});
```

## Lifecycle

Components automatically clean up their effects when unmounted:

```javascript
const MyComponent = createComponent(() => {
  createEffect(() => {
    const interval = setInterval(() => {
      console.log('tick');
    }, 1000);
    
    // This effect will be cleaned up automatically when component unmounts
    return () => clearInterval(interval);
  });
  
  return <div>Component</div>;
});

// Mount
const instance = render(MyComponent, container);

// Unmount (cleans up all effects)
instance.unmount();
```

## Comparison with Other Frameworks

### React
```javascript
// React
const [count, setCount] = useState(0);

// This system
const [count, setCount] = createSignal(0);
```

### SolidJS
```javascript
// SolidJS
const [count, setCount] = createSignal(0);
createEffect(() => console.log(count()));

// This system (same API!)
const [count, setCount] = createSignal(0);
createEffect(() => console.log(count()));
```

### Vue 3
```javascript
// Vue 3
const count = ref(0);
watchEffect(() => console.log(count.value));

// This system
const [count, setCount] = createSignal(0);
createEffect(() => console.log(count()));
```

## Best Practices

1. **Keep components small and focused**
2. **Use memos for expensive computations**
3. **Avoid unnecessary re-renders by keeping state local**
4. **Use effects for side effects only**
5. **Prefer JSX syntax for better developer experience**
6. **Use HTML templates only for simple cases or when build tools aren't available**

## Examples Directory

Check out the `signals-example/` directory for complete working examples:
- `01-basic-counter.jsx` - Basic counter with signals
- `02-todo-list.jsx` - Todo list with array management
- `03-timer-cleanup.jsx` - Timer with effects and cleanup
- `04-computed-memo.jsx` - Calculator with computed values
- `05-form-validation.jsx` - Form with reactive validation
- `06-component-composition.jsx` - Nested components
- `07-effects-demo.jsx` - Effects and cleanup demonstration

All examples use JSX syntax and can be run with `npm run dev`.

## License

MIT

## Contributing

Contributions welcome! Feel free to open issues or submit PRs