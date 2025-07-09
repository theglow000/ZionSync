# ZionSync Documentation Index

Welcome to the ZionSync documentation hub. This collection of guides provides comprehensive information for developers, team members, and administrators working with the ZionSync church service management system.

## 📖 Quick Reference

### [README.md](./README.md)
**Purpose**: Project overview and quick start guide  
**Description**: Primary documentation entry point covering system overview, key features, installation instructions, and team workflows. Essential reading for new users and developers getting started with ZionSync.

### [ai-agent-best-practices.md](./ai-agent-best-practices.md)
**Purpose**: AI development guidelines and behavioral protocols  
**Description**: Establishes mandatory investigation protocols, code quality standards, and behavioral rules for AI agents working on ZionSync development. Prevents common AI errors and ensures consistent code quality through investigation-first approaches.

## 🏗️ Architecture & Technical Design

### [architecture-overview.md](./architecture-overview.md)
**Purpose**: Comprehensive system architecture documentation  
**Description**: Details the technical foundation including Next.js 15 framework, MongoDB database design, technology stack, component organization, and architectural decisions. Essential for understanding system design and making architectural decisions.

### [database-schema.md](./database-schema.md)
**Purpose**: Complete database structure and schema reference  
**Description**: Comprehensive documentation of all MongoDB collections, field specifications, relationship patterns, and data validation rules. Critical for database operations, API development, and data migration tasks.

### [component-library.md](./component-library.md)
**Purpose**: UI component documentation and usage guidelines  
**Description**: Complete reference for all React components, custom hooks, styling patterns, and implementation guidelines. Covers shadcn/ui primitives, custom components, responsive design patterns, and accessibility features.

## 🔧 Development & Operations

### [environment-setup.md](./environment-setup.md)
**Purpose**: Development environment configuration guide  
**Description**: Setup instructions for local development, environment variables, MongoDB configuration, and deployment guidelines. Includes troubleshooting for common environment issues and production deployment options.

### [api-reference.md](./api-reference.md)
**Purpose**: Complete API endpoint documentation  
**Description**: Comprehensive reference for all REST API endpoints including request/response formats, error handling, authentication patterns, and usage examples. Essential for frontend development and API integration.

### [testing-strategy.md](./testing-strategy.md)
**Purpose**: Testing framework and quality assurance guidelines  
**Description**: Multi-layered testing approach covering unit tests, integration tests, API testing, and end-to-end testing. Includes Jest configuration, mocking strategies, performance testing, and coverage metrics.

## 🎵 Feature-Specific Guides

### [song-management-system.md](./song-management-system.md)
**Purpose**: Music library and song management documentation  
**Description**: Comprehensive guide for the song management system including duplicate detection, usage analytics, external integrations (Hymnary, SongSelect), suggestion algorithms, and the Quick-Add functionality.

### [liturgical-calendar-integration.md](./liturgical-calendar-integration.md)
**Purpose**: Liturgical calendar system documentation  
**Description**: Details the liturgical calendar integration including algorithmic season detection, color coding systems, seasonal theming, and UI integration. Covers Lutheran liturgical calendar support and automatic seasonal styling.

## 👥 User & Team Management

### [team-workflow-guide.md](./team-workflow-guide.md)
**Purpose**: Team coordination and workflow documentation  
**Description**: Comprehensive workflows for Presentation, Worship, and AV teams including service lifecycle management, cross-team coordination, user management processes, and real-time data synchronization patterns.

## 🛠️ Support & Maintenance

### [TroubleshootingGuide.md](./TroubleshootingGuide.md)
**Purpose**: Common issues and solutions reference  
**Description**: Solutions to common development and operational issues including MongoDB connection problems, build errors, API failures, and component rendering issues. Organized by category for quick resolution.

---

## 📚 Documentation Guidelines

### For Developers
Start with `README.md` → `architecture-overview.md` → `component-library.md` → specific feature guides as needed.

### For System Administrators
Begin with `environment-setup.md` → `database-schema.md` → `TroubleshootingGuide.md`.

### For AI Agents
**Mandatory reading**: `ai-agent-best-practices.md` before any development work.

### For Team Leaders
Focus on `team-workflow-guide.md` → `README.md` → feature-specific guides based on team needs.

---

## 🔄 Keeping Documentation Current

This documentation is a living resource that evolves with the ZionSync system. When making changes to the system:

1. Update relevant documentation files
2. Review this index for accuracy
3. Ensure cross-references remain valid
4. Follow the established documentation patterns

For questions about documentation or suggestions for improvements, refer to the team workflow guide for appropriate communication channels.
