# Contributing to MetaChecker

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. Fork the repository and clone it locally
   ```bash
   git clone https://github.com/palveeen22/metachecker-ai.git
   
   cd metachecker-ai
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Copy the environment file and add your API key:
   ```bash
   cp .env.example .env.local
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

## Branch Naming

Create a branch from `main` using the following convention:

| Prefix | Purpose |
|--------|---------|
| `feat/` | New features |
| `fix/` | Bug fixes |
| `docs/` | Documentation changes |
| `refactor/` | Code restructuring |
| `test/` | Adding or updating tests |
| `chore/` | Tooling, config, dependencies |

Example: `feat/add-lighthouse-score`, `fix/og-image-parsing`

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes (no code change)
refactor: code restructuring
test: add or update tests
perf: performance improvement
chore: tooling/config changes
```

Keep commit messages concise and descriptive. Use the imperative mood ("add" not "added").

## Architecture Rules (Feature-Sliced Design)

MetaChecker uses [Feature-Sliced Design](https://feature-sliced.design/). Please follow these rules:

### Layer Dependency

```
app → pages → widgets → features → entities → shared
```

- Each layer can **only import from layers below it**
- Never import upward (e.g., `shared` must not import from `features`)

### Module Boundaries

- Import from a module's **public API** (`index.ts`), not internal files
- Each feature/entity/widget should export via its own `index.ts`
- The `shared` layer has **zero domain knowledge**

### Where to Put New Code

| What you're adding | Where it goes |
|-------------------|---------------|
| Generic utility function | `src/shared/lib/` |
| Reusable UI component | `src/shared/ui/` |
| Domain type or model | `src/entities/<name>/model/` |
| Domain UI component | `src/entities/<name>/ui/` |
| Feature with API + UI | `src/features/<name>/` |
| Composite page section | `src/widgets/<name>/` |
| Full page layout | `src/pages/<name>/` |
| API route | `app/api/<name>/route.ts` |

## Coding Style

### Formatting & Linting

We use [Biome](https://biomejs.dev/) (not ESLint/Prettier). Run before committing:

```bash
pnpm lint      # Check for issues
pnpm format    # Auto-format code
```

### TypeScript

- **Strict mode** is enabled — no `any` types
- Use `interface` for object shapes, `type` for unions/intersections
- Use explicit return types for exported functions
- Path alias: `@/*` maps to `./src/*`

### General

- 2-space indentation
- Single quotes (enforced by Biome)
- Organize imports (auto-handled by Biome)
- Mark client components with `'use client'` directive
- Keep components focused — prefer composition over large components

## Testing

### Requirements

- New utilities in `shared/lib` must have unit tests
- API route changes must have route-level tests
- New user-facing features should have E2E coverage

### Running Tests

```bash
pnpm test            # Run unit tests (Vitest)
pnpm test:watch      # Run in watch mode
pnpm test:coverage   # Run with coverage report
pnpm test:e2e        # Run E2E tests (Playwright)
```

### Writing Tests

- Unit tests go alongside the code: `src/shared/lib/__tests__/my-util.test.ts`
- API route tests: `app/api/<name>/__tests__/route.test.ts`
- E2E tests: `e2e/<feature>.spec.ts`
- Mock external dependencies (`fetch`, Gemini API) — never call real APIs in tests

## Pull Request Process

1. Create a branch from `main` following the branch naming convention
2. Make your changes, keeping commits focused and well-described
3. Ensure all checks pass:
   ```bash
   pnpm lint
   pnpm test
   pnpm build
   ```
4. Push your branch and open a pull request
5. PR title should follow commit convention (e.g., `feat: add lighthouse score`)
6. PR description should include:
   - **What** changed and **why**
   - **How to test** the changes
   - Screenshots for UI changes
7. Request review from at least one maintainer
8. Address review feedback by pushing new commits (don't force-push)

## Error Handling

When modifying API routes, use the structured error system:

```typescript
import { ValidationError, ConfigurationError, ExternalServiceError, toErrorResponse, logger } from '@/shared/lib'

// Throw typed errors
throw new ValidationError('URL is required')
throw new ConfigurationError('API key missing')
throw new ExternalServiceError('gemini', 'No response')

// In catch block
const { body, status } = toErrorResponse(error)
return NextResponse.json(body, { status })

// Use logger instead of console
logger.info('Processing request', { url })
logger.error('Request failed', error, { route: '/api/metadata' })
```

See [ARCHITECTURE.md](./ARCHITECTURE.md#error-handling) for the full error handling documentation.
