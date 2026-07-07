# Angular Copilot Instructions

You are an expert in TypeScript, Angular, and scalable web application development. You write functional, maintainable, performant, and accessible code following Angular and TypeScript best practices.

## TypeScript Best Practices

- Use strict type checking
- Prefer type inference when the type is obvious
- Avoid the `any` type; use `unknown` when type is uncertain

## Angular Best Practices

- Always use standalone components over NgModules
- Must NOT set `standalone: true` inside Angular decorators. It's the default in Angular v20+.
- Use signals for state management
- Implement lazy loading for feature routes
- Do NOT use the `@HostBinding` and `@HostListener` decorators. Put host bindings inside the `host` object of the `@Component` or `@Directive` decorator instead
- Use `NgOptimizedImage` for all static images (does not work for inline base64 images)
- use reactive forms not ngModel for forms

## Accessibility Requirements

- It MUST pass all AXE checks.
- It MUST follow all WCAG AA minimums, including focus management, color contrast, and ARIA attributes.

## Components

- Keep components small and focused on a single responsibility
- Use `input()` and `output()` functions instead of decorators
- Use `computed()` for derived state
- Set `changeDetection: ChangeDetectionStrategy.OnPush` in `@Component` decorator
- Prefer inline templates for small components
- Prefer Reactive forms instead of Template-driven ones
- Do NOT use `ngClass`, use `class` bindings instead
- Do NOT use `ngStyle`, use `style` bindings instead
- When using external templates/styles, use paths relative to the component TS file
- always create component in dedicated directory
- always create html file, don`t put template into ts component file

## State Management

- Use signals for local component state
- Use `computed()` for derived state
- Keep state transformations pure and predictable
- Do NOT use `mutate` on signals, use `update` or `set` instead

## Templates

- Keep templates simple and avoid complex logic
- Use native control flow (`@if`, `@for`, `@switch`) instead of `*ngIf`, `*ngFor`, `*ngSwitch`
- Use the async pipe to handle observables
- Do not assume globals like (`new Date()`) are available
- Do not write arrow functions in templates (they are not supported)

## Services

- Design services around a single responsibility
- Use the `providedIn: 'root'` option for singleton services
- Use the `inject()` function instead of constructor injection

## Project-Specific Guidelines

This project uses:

- Angular 21 with standalone components and signals
- Tailwind CSS for styling
- Firebase for authentication and Firestore for data sync
- Angular Material for icons

When generating code for this project:

### Code Quality & Architecture

- Follow the existing code style and patterns.
- Prefer signals over RxJS where possible.
- Use `inject()` for dependency injection.
- Where possible, follow a smart / dummy component approach: separate logic from presentation by creating reusable components for UI sections. Keep the overall logic in the parent component.
- Do not duplicate existing code; try to reuse components, services, or functions already present in the project. If they do not exist, create utilities with reusable functions.
- Always create interfaces and types. If they are used in multiple places, move them to dedicated folders such as `models` or `types`.
- ALWAYS use English names for variables, functions, classes, and components so that their intent is clear; for booleans, use prefixes such as `has`, `is`, `can`, `should`.
- Avoid overly long functions: if they exceed 30–40 lines, consider splitting them into smaller, reusable functions.
- Use early returns to reduce nesting and improve readability.
- Comment only when necessary: the code should be self-explanatory. Use comments to explain the “why,” not the “what.”
- Always use atomic components from /src/ui in case of missing component ask to create
- Components located in pages should be minimalistic all building blocks compontets should be places in /features directory, each page has to have own directory in features eg. customers page should have directory features/customers 

### Responsive UI & UX

- Use Tailwind utility classes for styling.
- ALWAYS account for both desktop and mobile rendering. The generated code must be responsive using the appropriate Tailwind classes (`sm:`, `md:`, `lg:`, `xl:`).
- Pay attention to effects such as `hover:`, which are not available on mobile devices — use `active:` for touch feedback.
- Pay attention to text that may vary in length and make sure the interface adapts well to those variations without breaking the layout (use `truncate`, `line-clamp`, `min-w-0`, `flex-shrink`).
- Always include skeleton loaders or loading indicators for asynchronous operations that may take time.
- Always handle errors carefully by showing messages to the user without breaking the application.
- Use transitions and animations with `transition-*` for smooth visual feedback, but respect `prefers-reduced-motion`.
- Make sure interactive elements have touch-friendly sizes (minimum 44x44 px on mobile devices).
- Handle empty, loading, error, and success states for every section that loads data.

### Security

- Never expose API keys, secrets, or credentials in frontend code. Use environment variables.
- Always sanitize user input before displaying it to prevent XSS. Use `DomSanitizer` when necessary.
- Do not use `innerHTML` directly. If needed, use `[innerHTML]` with sanitized content.
- Always validate incoming data on the client side, while also assuming validation will happen on the server side.
- Use HTTPS for all external API calls.
- Do not store sensitive data in `localStorage` / `sessionStorage` without encryption.
- Implement rate limiting for repetitive operations (e.g. searches, form submissions).
- For Firebase: always configure the appropriate Security Rules and never rely solely on client-side validation.

### Performance

- Use `trackBy` with `@for` to optimize list rendering.
- Implement `ChangeDetectionStrategy.OnPush` in all components.
- Use `computed()` instead of getters for derived values — they are automatically memoized.
- Lazy load images with `loading="lazy"` and use `NgOptimizedImage` for static images.
- Avoid importing heavy libraries in full — use tree-shaking and import only what you need.
- Use `takeUntilDestroyed()` to automatically manage Observable unsubscription.
- Add debounce to search fields and other frequent operations (300–500 ms).
- Avoid making API calls in a loop — batch requests where possible.
- Use virtual scrolling (`@angular/cdk/scrolling`) for lists with a large number of items (>100 items).
- Minimize re-rendering by avoiding the creation of new objects/arrays in templates.
- Load data incrementally or with pagination for large datasets.
  

### Translations
- Use transloco for all texts in application, never use strings inside templates
