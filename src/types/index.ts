import type {Node, Edge} from 'reactflow';
import { OpenAPIV3 } from 'openapi-types';

// Type for external service
export interface ExternalService {
  id: string;
  name: string;
  description?: string;
  openApiDocument: OpenAPIV3.Document;
}

// Type for API endpoint
export interface ApiEndpoint {
  serviceId: string;
  path: string;
  method: string;
  operationId?: string;
  summary?: string;
  description?: string;
  parameters?: OpenAPIV3.ParameterObject[];
  requestBody?: OpenAPIV3.RequestBodyObject;
  responses?: Record<string, OpenAPIV3.ResponseObject>;
}

// Type for pipeline node
export interface PipelineNode extends Node {
  data: {
    label: string;
    endpoint?: ApiEndpoint;
    inputs: {
      id: string;
      name: string;
      type: string;
      value?: any;
      required: boolean;
      connected?: boolean;
    }[];
    outputs: {
      statusCode: string;
      items: {
        id: string;
        name: string;
        type: string;
        schema?: any; // Store the original schema for splitting
        path?: string[]; // Path to the property in the parent object (for nested properties)
      }[];
    }[];
  };
}

// Type for pipeline edge
export interface PipelineEdge extends Edge {
  data?: {
    sourceOutput?: string;
    targetInput?: string;
  };
}

// Type for pipeline
export interface Pipeline {
  id: string;
  name: string;
  description?: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  globalVariables?: Record<string, any>;
}

// Type for pipeline editor state
export interface PipelineEditorState {
  services: ExternalService[];
  pipeline: Pipeline;
  selectedNode: PipelineNode | null;
  selectedEdge: PipelineEdge | null;
}
