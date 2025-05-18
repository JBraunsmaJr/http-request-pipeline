# HTTP Request Pipeline Editor

A modern, dark-themed HTTP request pipeline editor built with React, TypeScript, and ReactFlow. This application allows users to create visual pipelines for HTTP requests by uploading OpenAPI documents and connecting endpoints together.

## Features

- **Dark Theme**: Modern dark theme for better visibility and reduced eye strain
- **OpenAPI Document Upload**: Upload and parse OpenAPI documents to extract endpoints
- **Service Management**: Associate OpenAPI documents with external services
- **Endpoint Selection**: Browse and search for endpoints in the uploaded documents
- **Visual Pipeline Editor**: Create pipelines by connecting nodes in a graph-based editor
- **Input/Output Ports**: Connect values between nodes using input and output ports
- **Node Configuration**: Edit node properties and input values

## Technologies Used

- **React**: UI library for building the user interface
- **TypeScript**: Type-safe JavaScript for better development experience
- **Vite**: Fast build tool for modern web development
- **ReactFlow**: Library for building node-based editors and workflows
- **Material-UI**: UI component library with dark theme support
- **OpenAPI Schema Validator**: Browser-compatible library for validating OpenAPI documents

## Getting Started

### Prerequisites

- Node.js (v14 or later)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Running the Application

Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173 (or another port if 5173 is in use).

### Building for Production

Build the application for production:

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Upload OpenAPI Documents**:
   - Go to the "API Services" tab
   - Click "Add Service"
   - Enter a name for the service
   - Upload an OpenAPI document

2. **Browse Endpoints**:
   - Select a service from the dropdown
   - Browse the available endpoints
   - Use the search box to find specific endpoints

3. **Create a Pipeline**:
   - Go to the "Pipeline Editor" tab
   - Add nodes by clicking the "+" button next to endpoints in the API Services tab
   - Connect nodes by dragging from an output port to an input port
   - Configure node inputs by clicking on a node and editing its properties in the details panel

## Project Structure

- `src/components`: React components
  - `Layout`: Application layout components
  - `ServiceManager`: Components for managing OpenAPI services
  - `EndpointSelector`: Components for selecting endpoints
  - `PipelineEditor`: Components for the pipeline editor
  - `MainPage`: Main application page
- `src/contexts`: React contexts
  - `ThemeContext`: Context for managing the dark theme
  - `PipelineContext`: Context for managing the pipeline state
- `src/types`: TypeScript type definitions
- `src/utils`: Utility functions
  - `openApiUtils`: Utilities for parsing OpenAPI documents
- `src/hooks`: Custom React hooks

## License

This project is licensed under the MIT License.
