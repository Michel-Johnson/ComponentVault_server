# ElectroVault - Electronic Component Inventory Management System

## Overview

ElectroVault is a modern web application for managing electronic component inventory. Built with a React frontend and Express backend, it provides a comprehensive solution for tracking electronic components, monitoring stock levels, and managing inventory operations. The application features a clean, responsive interface with real-time data updates and low-stock alerting capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Shadcn/UI component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation schemas

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **API Design**: RESTful endpoints for component CRUD operations
- **Data Layer**: In-memory storage implementation with interface for future database integration
- **Validation**: Zod schemas shared between frontend and backend
- **Development**: Hot reload with Vite integration for seamless development experience

### Data Storage Solutions
- **Current Implementation**: In-memory storage using Map data structures
- **Database Ready**: Drizzle ORM configured for PostgreSQL with migration support
- **Schema**: Shared TypeScript schemas using Drizzle and Zod for type safety
- **Component Model**: Tracks name, category, quantity, location, description, and minimum stock levels

### Authentication and Authorization
- **Status**: Not currently implemented
- **Architecture**: Express session middleware configured for future implementation
- **Session Storage**: PostgreSQL session store ready for production deployment

### API Structure
- **Base Path**: `/api` prefix for all API endpoints
- **Components**: Full CRUD operations with search and filtering capabilities
- **Endpoints**:
  - `GET /api/components` - List components with optional search and category filters
  - `GET /api/components/:id` - Get specific component details
  - `POST /api/components` - Create new component
  - `PATCH /api/components/:id` - Update component
  - `DELETE /api/components/:id` - Delete component
  - `GET /api/components/alerts/low-stock` - Get low stock alerts
  - `GET /api/stats` - Get inventory statistics

### Component Management Features
- **Categories**: Predefined categories for electronic components (Resistors, Capacitors, ICs, etc.)
- **Stock Tracking**: Real-time quantity tracking with low-stock alerts
- **Search & Filter**: Text search and category-based filtering
- **Location Tracking**: Physical location storage for component organization
- **Inventory Operations**: Quick quantity adjustments with validation

## External Dependencies

### UI and Styling
- **Radix UI**: Comprehensive set of accessible UI primitives for dialogs, dropdowns, and form controls
- **Tailwind CSS**: Utility-first CSS framework with custom configuration
- **Lucide React**: Icon library for consistent iconography
- **Class Variance Authority**: Utility for managing component variants

### Development and Build Tools
- **Vite**: Fast build tool with hot module replacement and TypeScript support
- **ESBuild**: Bundler for production server builds
- **TypeScript**: Type safety across the entire application stack

### Database and ORM
- **Drizzle ORM**: Type-safe database toolkit configured for PostgreSQL
- **Neon Database**: Serverless PostgreSQL provider for cloud deployment
- **Connect PG Simple**: PostgreSQL session store for Express sessions

### Validation and Forms
- **Zod**: Runtime type validation and schema definition
- **React Hook Form**: Performant form library with validation integration
- **Hookform Resolvers**: Integration layer between React Hook Form and Zod

### State Management and Data Fetching
- **TanStack Query**: Server state management with caching, background updates, and optimistic updates
- **Wouter**: Lightweight routing library for single-page application navigation

### Development Environment
- **Replit Integration**: Custom Vite plugins for development banner and error overlay
- **TSX**: TypeScript execution for development server
- **PostCSS**: CSS processing with Tailwind and Autoprefixer