# Wulin Master Developer Guide

This guide outlines the modern architecture of Wulin Master and provides instructions for developing new features.

## Architecture Overview

Wulin Master is organized as a Monorepo using Yarn Workspaces:

- `@wulin-master/core`: Core logic, API client, configuration management, and shared types.
- `@wulin-master/slickgrid`: SlickGrid integration, Actions, and Behaviors.
- `@wulin-master/stimulus`: Stimulus controllers for UI interaction.

## Developing Actions

Actions are toolbar items or context menu items. They should be modularized and registered with `ActionManager`.

### Creating a New Action

1. Create a new file in `packages/@wulin-master/slickgrid/src/actions/my_action.ts`.
2. Implement the `GridAction` interface.
3. Register the action.

```typescript
import { GridAction } from '@wulin-master/core';
import { BaseAction, ActionManager } from '../action_manager';

const MyAction: GridAction = Object.assign({}, BaseAction, {
  name: 'my_action',
  handler: function(this: GridAction) {
    const grid = this.target;
    // Your logic here
  }
});

ActionManager.register(MyAction);
export default MyAction;
```

4. Export it from `packages/@wulin-master/slickgrid/src/index.ts`.
5. Mount it in `packages/@wulin-master/slickgrid/src/master.ts`.

## Developing Behaviors

Behaviors are event-driven logic attached to grids.

### Creating a New Behavior

1. Create a new file in `packages/@wulin-master/slickgrid/src/behaviors/my_behavior.ts`.
2. Implement the `GridBehavior` interface.

```typescript
import { WulinGrid, GridBehavior } from '@wulin-master/core';
import { BaseBehavior, BehaviorManager } from '../behavior_manager';

const MyBehavior: GridBehavior = Object.assign({}, BaseBehavior, {
  name: 'my_behavior',
  event: 'onSomeEvent',
  subscribe: function(this: GridBehavior, target: WulinGrid) {
    this.grid = target;
    (target as any)[this.event].subscribe(() => this.handler());
  },
  handler: function(this: GridBehavior) {
    // Your logic here
  }
});

BehaviorManager.register('my_behavior', MyBehavior);
export default MyBehavior;
```

## Global Configuration

Avoid direct access to `window`. Use `ConfigManager` from `@wulin-master/core`.

```typescript
import { ConfigManager } from '@wulin-master/core';

const token = ConfigManager.getCsrfToken();
const theme = ConfigManager.getMasterDetailColorTheme();
```

## Styling

Use **Tailwind CSS** for new UI components. Avoid adding new styles to legacy `.scss` files.

- Configuration: `tailwind.config.js`
- Custom components: `packages/@wulin-master/slickgrid/src/tailwind.css`

## Testing

Run unit tests using Jest:

```bash
yarn test
```

Tests are located in `__tests__` directories within each package.
