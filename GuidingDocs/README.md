# ZionSync

**A comprehensive church service management system for coordinating Presentation, Worship, and Audio/Video teams.**

## Overview

ZionSync is a Next.js 15 application built with MongoDB that streamlines church service coordination across three distinct teams. The system integrates liturgical calendar awareness, intelligent song management, and team-specific workflows to ensure seamless service preparation and execution.

### Key Features

- **Multi-Team Coordination**: Separate workflows for Presentation, Worship, and A/V teams
- **Liturgical Calendar Integration**: Automatic season detection and themed styling
- **Intelligent Song Management**: Duplicate detection, usage analytics, and suggestion engine
- **Real-Time Synchronization**: Teams work with shared, up-to-date service information
- **Mobile-First Design**: Responsive interface optimized for both desktop and mobile devices
- **No Authentication Required**: Trust-based internal tool for church staff

## Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Modern web browser

### Installation
```bash
# Clone the repository
git clone [repository-url]

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your MongoDB connection string

# Run development server
npm run dev
```

### First Use
1. Navigate to `http://localhost:3000`
2. Select your team from the splash screen
3. Add your name to the team roster
4. Begin coordinating your team's service responsibilities

## Team Workflows

### Presentation Team
- Create and manage service details
- Assign volunteer roles
- Coordinate with Pastor for service elements

### Worship Team  
- Select songs based on service themes
- Schedule worship team members
- Track song usage and analytics

### Audio/Video Team
- Assign AV operators to services
- Monitor service completion status
- Manage technical requirements

## Documentation

For detailed development information, see the `GuidingDocs/` folder:
- **Architecture Overview**: System design and technology stack
- **API Reference**: Complete endpoint documentation  
- **Component Library**: UI component specifications
- **Database Schema**: MongoDB collection definitions
- **Liturgical Calendar**: Season detection and theming system
- **Song Management**: Music library and analytics system
- **Team Workflows**: Detailed process documentation
- **Testing Strategy**: Testing approach and best practices
- **AI Agent Best Practices**: Development guidelines for AI assistance

## Technology Stack

- **Frontend**: Next.js 15.0.3, React 18.3.1, Tailwind CSS
- **Backend**: Next.js API Routes, MongoDB
- **UI Components**: Radix UI, shadcn/ui
- **Testing**: Jest, React Testing Library
- **Deployment**: Vercel-ready configuration

## Contributing

This project follows established patterns documented in `GuidingDocs/`. Please review the AI Agent Best Practices guide before making contributions.

## License

Internal church tool - not licensed for external use.