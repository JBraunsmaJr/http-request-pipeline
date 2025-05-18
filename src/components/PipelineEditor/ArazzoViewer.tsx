import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab
} from '@mui/material';
import { usePipeline } from '../../contexts/PipelineContext';
import { useTheme } from '../../contexts/ThemeContext';

interface ArazzoViewerProps {
  open: boolean;
  onClose: () => void;
}

// Arazzo specification types
interface ArazzoDocument {
  arazzo: string;
  info: {
    title: string;
    description?: string;
    version?: string;
    termsOfService?: string;
    contact?: {
      name?: string;
      url?: string;
      email?: string;
    };
    license?: {
      name: string;
      url?: string;
    };
  };
  workflow: {
    id?: string;
    inputs?: Record<string, ArazzoParameter>;
    outputs?: Record<string, ArazzoParameter>;
    steps: Record<string, ArazzoStep>;
  };
}

interface ArazzoParameter {
  description?: string;
  schema: {
    type: string;
    format?: string;
    items?: any;
    properties?: Record<string, any>;
    required?: string[];
  };
  required?: boolean;
}

interface ArazzoStep {
  type: 'operation' | 'workflow' | 'branch' | 'parallel' | 'foreach' | 'wait';
  name?: string;
  description?: string;
  operation?: {
    method: 'get' | 'put' | 'post' | 'delete' | 'options' | 'head' | 'patch' | 'trace';
    path: string;
    server?: string;
  };
  inputs?: Record<string, string | object>;
  outputs?: Record<string, ArazzoParameter>;
  next?: string;
}

const ArazzoViewer: React.FC<ArazzoViewerProps> = ({ open, onClose }) => {
  const { pipeline, nodes, edges } = usePipeline();
  const { darkMode } = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Convert pipeline to Arazzo format
  const convertToArazzo = (): ArazzoDocument => {
    const arazzoSteps: Record<string, ArazzoStep> = {};
    const stepConnections: Record<string, string> = {};

    // Process nodes
    nodes.forEach(node => {
      const { id, data, type } = node;

      // Determine step type based on node type
      let stepType: ArazzoStep['type'] = 'operation';
      if (type === 'inputNode') {
        stepType = 'operation'; // Using operation as a fallback since 'input' is not a valid step type in Arazzo
      } else if (type === 'outputNode') {
        stepType = 'operation'; // Using operation as a fallback since 'output' is not a valid step type in Arazzo
      }

      // Create step based on node type
      let step: ArazzoStep = {
        type: stepType,
        name: data.label
      };

      // Add operation details for API nodes
      if (type === 'apiNode' && data.endpoint) {
        step.operation = {
          method: data.endpoint.method as any, // Type assertion to handle potential method mismatch
          path: data.endpoint.path
        };
      }

      // Add inputs as a record
      if (data.inputs && data.inputs.length > 0) {
        step.inputs = {};
        data.inputs.forEach(input => {
          step.inputs![input.name] = input.value || input.name; // Use value if available, otherwise use name as reference
        });
      }

      // Add outputs as a record
      if (data.outputs && data.outputs.length > 0) {
        step.outputs = {};
        data.outputs.forEach(outputGroup => {
          outputGroup.items.forEach(output => {
            step.outputs![output.name] = {
              schema: {
                type: output.type
              }
            };
          });
        });
      }

      arazzoSteps[id] = step;
    });

    // Process edges to establish connections
    edges.forEach(edge => {
      const { source, target } = edge;
      // In Arazzo, a step can only have one 'next' step
      // We'll use the last connection for simplicity
      stepConnections[source] = target;
    });

    // Add next step to each step
    Object.keys(arazzoSteps).forEach(stepId => {
      if (stepConnections[stepId]) {
        arazzoSteps[stepId].next = stepConnections[stepId];
      }
    });

    // Create workflow inputs
    const workflowInputs: Record<string, ArazzoParameter> = {};
    if (pipeline.inputs && pipeline.inputs.length > 0) {
      pipeline.inputs.forEach(input => {
        workflowInputs[input.name] = {
          description: input.description,
          schema: {
            type: input.type
          },
          required: false // Default to false as per schema
        };
      });
    }

    // Create workflow outputs
    const workflowOutputs: Record<string, ArazzoParameter> = {};
    if (pipeline.outputs && pipeline.outputs.length > 0) {
      pipeline.outputs.forEach(output => {
        workflowOutputs[output.name] = {
          description: output.description,
          schema: {
            type: output.type
          },
          required: false // Default to false as per schema
        };
      });
    }

    // Create the Arazzo document
    const arazzoDocument: ArazzoDocument = {
      arazzo: "1.0.0", // Using the current version of the Arazzo specification
      info: {
        title: pipeline.name || "HTTP Request Pipeline",
        description: pipeline.description,
        version: "1.0.0" // Default version
      },
      workflow: {
        id: pipeline.id,
        steps: arazzoSteps,
        inputs: Object.keys(workflowInputs).length > 0 ? workflowInputs : undefined,
        outputs: Object.keys(workflowOutputs).length > 0 ? workflowOutputs : undefined
      }
    };

    return arazzoDocument;
  };

  const arazzoDocument = convertToArazzo();
  const arazzoJson = JSON.stringify(arazzoDocument, null, 2);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="arazzo-viewer-dialog"
    >
      <DialogTitle id="arazzo-viewer-dialog">
        Arazzo Document Visualization
      </DialogTitle>
      <DialogContent dividers>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="arazzo viewer tabs">
          <Tab label="JSON" />
          <Tab label="Visualization" />
        </Tabs>
        <Box sx={{ mt: 2 }}>
          {tabValue === 0 && (
            <Paper 
              sx={{ 
                p: 2, 
                backgroundColor: darkMode ? '#1e1e1e' : '#f5f5f5',
                maxHeight: '60vh',
                overflow: 'auto'
              }}
            >
              <pre style={{ margin: 0, overflow: 'auto' }}>
                {arazzoJson}
              </pre>
            </Paper>
          )}
          {tabValue === 1 && (
            <Box sx={{ p: 2, height: '60vh', overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>
                {arazzoDocument.info.title}
              </Typography>
              {arazzoDocument.info.description && (
                <Typography variant="body2" gutterBottom>
                  {arazzoDocument.info.description}
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Arazzo Version: {arazzoDocument.arazzo}
                </Typography>

                {/* Workflow Inputs */}
                {arazzoDocument.workflow.inputs && Object.keys(arazzoDocument.workflow.inputs).length > 0 && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Workflow Inputs:
                    </Typography>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      {Object.entries(arazzoDocument.workflow.inputs).map(([name, param]) => (
                        <Typography key={name} variant="body2">
                          {name}: {param.schema.type} {param.required ? '(Required)' : '(Optional)'}
                          {param.description && ` - ${param.description}`}
                        </Typography>
                      ))}
                    </Paper>
                  </Box>
                )}

                {/* Workflow Outputs */}
                {arazzoDocument.workflow.outputs && Object.keys(arazzoDocument.workflow.outputs).length > 0 && (
                  <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom>
                      Workflow Outputs:
                    </Typography>
                    <Paper sx={{ p: 2, mb: 2 }}>
                      {Object.entries(arazzoDocument.workflow.outputs).map(([name, param]) => (
                        <Typography key={name} variant="body2">
                          {name}: {param.schema.type}
                          {param.description && ` - ${param.description}`}
                        </Typography>
                      ))}
                    </Paper>
                  </Box>
                )}

                {/* Steps */}
                <Typography variant="subtitle1" gutterBottom>
                  Steps:
                </Typography>
                {Object.entries(arazzoDocument.workflow.steps).map(([stepId, step]) => (
                  <Paper 
                    key={stepId} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px solid',
                      borderColor: step.type === 'operation' ? '#2196f3' : 
                                  step.type === 'workflow' ? '#4caf50' : 
                                  step.type === 'branch' ? '#ff9800' : 
                                  step.type === 'parallel' ? '#9c27b0' : 
                                  step.type === 'foreach' ? '#00bcd4' : '#f44336',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2">
                      {step.name || stepId} ({step.type})
                    </Typography>
                    {step.description && (
                      <Typography variant="body2" color="text.secondary">
                        {step.description}
                      </Typography>
                    )}
                    {step.operation && (
                      <Typography variant="body2">
                        {step.operation.method.toUpperCase()} {step.operation.path}
                        {step.operation.server && ` (Server: ${step.operation.server})`}
                      </Typography>
                    )}
                    {step.inputs && Object.keys(step.inputs).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Inputs:
                        </Typography>
                        {Object.entries(step.inputs).map(([name, value]) => (
                          <Typography key={name} variant="body2" sx={{ ml: 2 }}>
                            {name}: {typeof value === 'string' ? value : JSON.stringify(value)}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {step.outputs && Object.keys(step.outputs).length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Outputs:
                        </Typography>
                        {Object.entries(step.outputs).map(([name, param]) => (
                          <Typography key={name} variant="body2" sx={{ ml: 2 }}>
                            {name}: {param.schema.type}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {step.next && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Next Step:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {step.next}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Box>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default ArazzoViewer;
