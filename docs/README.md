# Documentation

This directory contains technical documentation for the Actually Hangout monolith application.

## Available Documentation

### [Database Schema](./database-schema.md)
Comprehensive database schema documentation with entity-relationship diagrams:
- Complete schema overview
- Domain-specific diagrams (Hangouts, Social Network, Availability, Engagement)
- Schema insights and best practices
- Migration requirements

### [Hangout Update Feature](./hangout-update-feature.md)
Complete documentation for the hangout update functionality:
- API endpoints and GraphQL mutations
- Sequence diagrams for all update flows
- Data model and entity relationships
- Authorization and validation rules
- Error handling
- Examples and testing guidance

## Viewing Mermaid Diagrams

The diagrams in this documentation use [Mermaid](https://mermaid.js.org/) syntax. They can be viewed in:

- **GitHub**: Automatically renders Mermaid diagrams in markdown files
- **VS Code**: Install the "Markdown Preview Mermaid Support" extension
- **Mermaid Live Editor**: Copy/paste diagrams to https://mermaid.live/
- **IDEs**: Most modern IDEs have Mermaid plugins available

## Contributing to Documentation

When adding new documentation:

1. Use clear, descriptive filenames
2. Include a table of contents for longer documents
3. Add diagrams where helpful (use Mermaid for consistency)
4. Update this README with links to new documentation
5. Keep documentation synchronized with code changes

## Related Resources

- [Main README](../README.md) - Project setup and overview
- [CLAUDE.md](../CLAUDE.md) - Development guidelines for Claude Code
- [Migrations](../src/db/migrations/) - Database migration files
- [Entity Definitions](../src/*/entities/) - TypeORM entity definitions
