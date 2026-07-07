# PennyScan Contributing Guide

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/pennyscan.git`
3. Add upstream: `git remote add upstream https://github.com/original/pennyscan.git`
4. Create a branch: `git checkout -b feature/my-feature`

## Development Setup

```bash
# Install dependencies
npm install

# Start local environment
docker-compose up -d

# Run migrations
npx prisma migrate dev

# Start development server
npm run dev
```

## Code Style

- **Language**: TypeScript (strict mode)
- **Formatter**: Prettier
- **Linter**: ESLint
- **Naming**: camelCase for variables/functions, PascalCase for classes/components

```bash
# Format code
npm run format

# Check linting
npm run lint

# Fix issues
npm run lint:fix
```

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage

# E2E tests
npm run test:e2e
```

Write tests for new features:

```typescript
// test/feature.test.ts
describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = ...;
    
    // Assert
    expect(result).toBe(...);
  });
});
```

## Adding a Store

See [STORE_ADAPTERS.md](./STORE_ADAPTERS.md) for step-by-step guide.

## Commit Messages

Use conventional commits:

```
feat: add Walmart penny scraper
fix: resolve geolocation bug
docs: update README
test: add store adapter tests
refactor: optimize distance calculation
chore: update dependencies
```

## Pull Request Process

1. Update documentation if needed
2. Add/update tests
3. Run `npm test` and ensure all pass
4. Create PR with clear description
5. Reference any related issues
6. Wait for review
7. Address feedback
8. Merge when approved

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.2.3`
4. Push tag: `git push origin v1.2.3`
5. Create GitHub release
6. CI/CD deploys automatically

## Reporting Issues

1. Check existing issues first
2. Use issue template
3. Include:
   - Description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, browser, etc.)
   - Screenshots if applicable

## Feature Requests

1. Describe the feature
2. Explain the use case
3. Suggest implementation (if applicable)
4. Discuss priority

## Code Review Guidelines

- Be respectful and constructive
- Explain reasoning for suggestions
- Ask questions to understand intent
- Approve once satisfied
- Use suggestion feature for minor changes

## Performance Considerations

- Database queries should use indexes
- Lazy-load images and results
- Cache frequently accessed data
- Monitor bundle size
- Profile before optimizing

## Security

- Never commit secrets to git
- Validate all user input
- Use HTTPS in production
- Keep dependencies updated
- Report security issues privately

## Questions?

Join our community:
- Discord: [link]
- GitHub Discussions: [link]
- Email: support@pennyscan.com

Thank you for contributing! 🎉
