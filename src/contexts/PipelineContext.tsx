import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { useNodesState, useEdgesState } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import type {
  ExternalService,
  Pipeline,
  PipelineNode,
  PipelineEdge,
  ApiEndpoint
} from '../types';
import { resolveSchemaRef } from '../utils/openApiUtils';

// Default state
const defaultPipeline: Pipeline = {
  id: uuidv4(),
  name: 'New Pipeline',
  description: '',
  nodes: [],
  edges: [],
  globalVariables: {}
};

// Create context
interface PipelineContextType {
  services: ExternalService[];
  addService: (service: ExternalService) => void;
  removeService: (serviceId: string) => void;
  pipeline: Pipeline;
  setPipelineName: (name: string) => void;
  setPipelineDescription: (description: string) => void;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  onNodesChange: any;
  onEdgesChange: any;
  addNode: (endpoint: ApiEndpoint) => void;
  updateNode: (nodeId: string, data: Partial<PipelineNode['data']>) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (sourceId: string, targetId: string, sourceOutput?: string, targetInput?: string) => void;
  removeEdge: (edgeId: string) => void;
  selectedNode: PipelineNode | null;
  setSelectedNode: (node: PipelineNode | null) => void;
  selectedEdge: PipelineEdge | null;
  setSelectedEdge: (edge: PipelineEdge | null) => void;
  setGlobalVariable: (key: string, value: any) => void;
  removeGlobalVariable: (key: string) => void;
  savePipeline: (name?: string) => Pipeline;
  loadPipeline: () => Pipeline | null;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);

// Provider component
interface PipelineProviderProps {
  children: ReactNode;
}

// Local storage keys
const STORAGE_KEYS = {
  PIPELINE: 'pipeline',
  SERVICES: 'services'
};

export const PipelineProvider: React.FC<PipelineProviderProps> = ({ children }) => {
  const [services, setServices] = useState<ExternalService[]>(() => {
    // Try to load services from localStorage
    const savedServices = localStorage.getItem(STORAGE_KEYS.SERVICES);
    return savedServices ? JSON.parse(savedServices) : [];
  });

  const [pipeline, setPipeline] = useState<Pipeline>(() => {
    // Try to load pipeline from localStorage
    const savedPipeline = localStorage.getItem(STORAGE_KEYS.PIPELINE);
    return savedPipeline ? JSON.parse(savedPipeline) : defaultPipeline;
  });

  const [nodes, setNodes, onNodesChange] = useNodesState(pipeline.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(pipeline.edges || []);
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<PipelineEdge | null>(null);

  // Service management
  const addService = (service: ExternalService) => {
    setServices(prev => [...prev, service]);
  };

  const removeService = (serviceId: string) => {
    setServices(prev => prev.filter(service => service.id !== serviceId));
    // Also remove nodes that use this service
    setNodes(prev => prev.filter(node => 
      !node.data.endpoint || node.data.endpoint.serviceId !== serviceId
    ));
  };

  // Pipeline management
  const setPipelineName = (name: string) => {
    setPipeline(prev => ({ ...prev, name }));
  };

  const setPipelineDescription = (description: string) => {
    setPipeline(prev => ({ ...prev, description }));
  };

  // Node management
  const addNode = (endpoint: ApiEndpoint) => {
    const newNode: PipelineNode = {
      id: uuidv4(),
      type: 'apiNode',
      position: { x: 100, y: 100 },
      data: {
        label: `${endpoint.method.toUpperCase()} ${endpoint.path}`,
        endpoint,
        inputs: [],
        outputs: []
      }
    };

    // Add inputs based on endpoint parameters and request body
    if (endpoint.parameters) {
      endpoint.parameters.forEach(param => {
        if (param.in === 'path' || param.in === 'query' || param.in === 'header') {
          newNode.data.inputs.push({
            id: uuidv4(),
            name: param.name,
            type: param.schema?.type || 'string',
            required: param.required || false
          });
        }
      });
    }

    if (endpoint.requestBody) {
      const content = endpoint.requestBody.content;
      if (content && content['application/json']) {
        const schema = content['application/json'].schema;
        if (schema && 'properties' in schema) {
          Object.entries(schema.properties || {}).forEach(([name, prop]) => {
            newNode.data.inputs.push({
              id: uuidv4(),
              name,
              type: (prop as any).type || 'string',
              required: schema.required?.includes(name) || false
            });
          });
        }
      }
    }

    // Add outputs based on response schema, organized by status code
    if (endpoint.responses) {
      // Find the service to get the OpenAPI document for resolving $refs
      const service = services.find(s => s.id === endpoint.serviceId);
      const openApiDocument = service?.openApiDocument;

      Object.entries(endpoint.responses).forEach(([code, response]) => {
        if (response.content && response.content['application/json']) {
          const schema = response.content['application/json'].schema;
          const outputItems = [];

          // Process schema properties
          if (schema) {
            // If it's a reference
            if ('$ref' in schema && openApiDocument) {
              // Resolve the reference
              const resolvedSchema = resolveSchemaRef(schema.$ref, openApiDocument);
              if (resolvedSchema) {
                // If it's an object with properties
                if (resolvedSchema.properties) {
                  Object.entries(resolvedSchema.properties).forEach(([name, prop]) => {
                    outputItems.push({
                      id: uuidv4(),
                      name,
                      type: (prop as any).type || 'string',
                      schema: prop,
                      path: [name]
                    });
                  });
                }
                // If it's an array
                else if (resolvedSchema.type === 'array' && resolvedSchema.items) {
                  outputItems.push({
                    id: uuidv4(),
                    name: 'items',
                    type: 'array',
                    schema: resolvedSchema,
                    path: ['items']
                  });
                }
                // If it's a primitive type
                else if (resolvedSchema.type) {
                  outputItems.push({
                    id: uuidv4(),
                    name: 'response',
                    type: resolvedSchema.type,
                    schema: resolvedSchema,
                    path: []
                  });
                }
              }
            }
            // If it's an object with properties
            else if ('properties' in schema) {
              Object.entries(schema.properties || {}).forEach(([name, prop]) => {
                outputItems.push({
                  id: uuidv4(),
                  name,
                  type: (prop as any).type || 'string',
                  schema: prop,
                  path: [name]
                });
              });
            } 
            // If it's an array
            else if (schema.type === 'array' && schema.items) {
              // Check if array items is a reference
              if ('$ref' in schema.items && openApiDocument) {
                // Resolve the reference
                const resolvedItems = resolveSchemaRef(schema.items.$ref, openApiDocument);

                if (resolvedItems) {
                  outputItems.push({
                    id: uuidv4(),
                    name: 'items',
                    type: 'array',
                    schema: { ...schema, items: resolvedItems },
                    path: ['items']
                  });
                } else {
                  // Fallback if reference can't be resolved
                  outputItems.push({
                    id: uuidv4(),
                    name: 'items',
                    type: 'array',
                    schema: schema,
                    path: ['items']
                  });
                }
              } else {
                outputItems.push({
                  id: uuidv4(),
                  name: 'items',
                  type: 'array',
                  schema: schema,
                  path: ['items']
                });
              }
            }
            // If it's a primitive type
            else if (schema.type) {
              outputItems.push({
                id: uuidv4(),
                name: 'response',
                type: schema.type,
                schema: schema,
                path: []
              });
            }
          }

          // Add the output group for this status code
          if (outputItems.length > 0) {
            newNode.data.outputs.push({
              statusCode: code,
              items: outputItems
            });
          }
        }
      });
    }

    setNodes(prev => [...prev, newNode]);
  };

  const updateNode = (nodeId: string, data: Partial<PipelineNode['data']>) => {
    setNodes(prev => 
      prev.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...node.data, ...data } } 
          : node
      )
    );
  };

  const removeNode = (nodeId: string) => {
    setNodes(prev => prev.filter(node => node.id !== nodeId));
    setEdges(prev => prev.filter(edge => 
      edge.source !== nodeId && edge.target !== nodeId
    ));
  };

  // Edge management
  const addEdge = (sourceId: string, targetId: string, sourceOutput?: string, targetInput?: string) => {
    // Find source and target nodes
    const sourceNode = nodes.find(node => node.id === sourceId);
    const targetNode = nodes.find(node => node.id === targetId);

    if (!sourceNode || !targetNode || !sourceOutput || !targetInput) {
      return;
    }

    // Find the source output and target input
    let sourceOutputItem = null;
    let sourceOutputType = '';

    // Search through all output groups and items to find the matching output
    for (const outputGroup of sourceNode.data.outputs) {
      for (const item of outputGroup.items) {
        if (item.id === sourceOutput) {
          sourceOutputItem = item;
          sourceOutputType = item.type;
          break;
        }
      }
      if (sourceOutputItem) break;
    }

    // Find the target input
    const targetInputItem = targetNode.data.inputs.find(input => input.id === targetInput);

    if (!sourceOutputItem || !targetInputItem) {
      return;
    }

    // Check if types are compatible
    const isTypeCompatible = 
      sourceOutputType === targetInputItem.type || 
      // Allow connecting object to any type as it might contain the required type
      sourceOutputType === 'object' ||
      // Allow connecting array to array
      (sourceOutputType === 'array' && targetInputItem.type === 'array');

    if (!isTypeCompatible) {
      console.warn(`Type mismatch: Cannot connect ${sourceOutputType} to ${targetInputItem.type}`);
      return;
    }

    // Create the edge
    const newEdge: PipelineEdge = {
      id: uuidv4(),
      source: sourceId,
      target: targetId,
      data: {
        sourceOutput,
        targetInput
      }
    };

    // Add the edge
    setEdges(prev => [...prev, newEdge]);

    // Disable manual input for the target input
    const updatedInputs = targetNode.data.inputs.map(input => 
      input.id === targetInput 
        ? { ...input, connected: true } 
        : input
    );

    updateNode(targetId, { inputs: updatedInputs });
  };

  const removeEdge = (edgeId: string) => {
    // Find the edge to be removed
    const edgeToRemove = edges.find(edge => edge.id === edgeId);

    if (edgeToRemove && edgeToRemove.data?.targetInput) {
      // Find the target node
      const targetNode = nodes.find(node => node.id === edgeToRemove.target);

      if (targetNode) {
        // Update the target input to remove the connected flag
        const updatedInputs = targetNode.data.inputs.map(input => 
          input.id === edgeToRemove.data?.targetInput 
            ? { ...input, connected: false } 
            : input
        );

        // Update the node
        updateNode(targetNode.id, { inputs: updatedInputs });
      }
    }

    // Remove the edge
    setEdges(prev => prev.filter(edge => edge.id !== edgeId));
  };

  // Global variables management
  const setGlobalVariable = (key: string, value: any) => {
    setPipeline(prev => ({
      ...prev,
      globalVariables: {
        ...(prev.globalVariables || {}),
        [key]: value
      }
    }));
  };

  const removeGlobalVariable = (key: string) => {
    setPipeline(prev => {
      const { [key]: _, ...rest } = prev.globalVariables || {};
      return {
        ...prev,
        globalVariables: rest
      };
    });
  };

  // Update pipeline when nodes or edges change
  React.useEffect(() => {
    setPipeline(prev => ({
      ...prev,
      nodes,
      edges
    }));
  }, [nodes, edges]);

  // Save pipeline to localStorage when it changes
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PIPELINE, JSON.stringify(pipeline));
  }, [pipeline]);

  // Save services to localStorage when they change
  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(services));
  }, [services]);

  // Explicit save/load functions
  const savePipeline = (name?: string) => {
    const pipelineToSave = {
      ...pipeline,
      name: name || pipeline.name,
      savedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.PIPELINE, JSON.stringify(pipelineToSave));
    return pipelineToSave;
  };

  const loadPipeline = () => {
    const savedPipeline = localStorage.getItem(STORAGE_KEYS.PIPELINE);
    if (savedPipeline) {
      const parsedPipeline = JSON.parse(savedPipeline);
      setPipeline(parsedPipeline);
      setNodes(parsedPipeline.nodes || []);
      setEdges(parsedPipeline.edges || []);
      return parsedPipeline;
    }
    return null;
  };

  const value = {
    services,
    addService,
    removeService,
    pipeline,
    setPipelineName,
    setPipelineDescription,
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    removeEdge,
    selectedNode,
    setSelectedNode,
    selectedEdge,
    setSelectedEdge,
    setGlobalVariable,
    removeGlobalVariable,
    savePipeline,
    loadPipeline
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
};

// Custom hook to use the pipeline context
export const usePipeline = () => {
  const context = useContext(PipelineContext);
  if (context === undefined) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
};
