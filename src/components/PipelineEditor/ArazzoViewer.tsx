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
interface ArazzoWorkflow {
  id: string;
  name: string;
  description?: string;
  steps: ArazzoStep[];
  inputs?: ArazzoIO[];
  outputs?: ArazzoIO[];
}

interface ArazzoStep {
  id: string;
  name: string;
  type: string;
  operation?: {
    method: string;
    path: string;
  };
  inputs?: ArazzoIO[];
  outputs?: ArazzoIO[];
  next?: string[];
}

interface ArazzoIO {
  id: string;
  name: string;
  type: string;
  description?: string;
  value?: any;
}

const ArazzoViewer: React.FC<ArazzoViewerProps> = ({ open, onClose }) => {
  const { pipeline, nodes, edges } = usePipeline();
  const { darkMode } = useTheme();
  const [tabValue, setTabValue] = useState(0);

  // Convert pipeline to Arazzo format
  const convertToArazzo = (): ArazzoWorkflow => {
    const arazzoSteps: ArazzoStep[] = [];
    const stepConnections: Record<string, string[]> = {};

    // Process nodes
    nodes.forEach(node => {
      const { id, data, type } = node;
      
      // Create step based on node type
      let step: ArazzoStep = {
        id,
        name: data.label,
        type: type === 'apiNode' ? 'operation' : type === 'inputNode' ? 'input' : 'output',
        inputs: [],
        outputs: []
      };

      // Add operation details for API nodes
      if (type === 'apiNode' && data.endpoint) {
        step.operation = {
          method: data.endpoint.method,
          path: data.endpoint.path
        };
      }

      // Add inputs
      if (data.inputs && data.inputs.length > 0) {
        step.inputs = data.inputs.map(input => ({
          id: input.id,
          name: input.name,
          type: input.type,
          value: input.value
        }));
      }

      // Add outputs
      if (data.outputs && data.outputs.length > 0) {
        data.outputs.forEach(outputGroup => {
          outputGroup.items.forEach(output => {
            step.outputs.push({
              id: output.id,
              name: output.name,
              type: output.type
            });
          });
        });
      }

      arazzoSteps.push(step);
      stepConnections[id] = [];
    });

    // Process edges to establish connections
    edges.forEach(edge => {
      const { source, target } = edge;
      if (stepConnections[source]) {
        stepConnections[source].push(target);
      }
    });

    // Add next steps to each step
    arazzoSteps.forEach(step => {
      if (stepConnections[step.id] && stepConnections[step.id].length > 0) {
        step.next = stepConnections[step.id];
      }
    });

    // Create the Arazzo workflow
    const arazzoWorkflow: ArazzoWorkflow = {
      id: pipeline.id,
      name: pipeline.name,
      description: pipeline.description,
      steps: arazzoSteps,
      inputs: pipeline.inputs?.map(input => ({
        id: input.id,
        name: input.name,
        type: input.type,
        description: input.description,
        value: input.value
      })),
      outputs: pipeline.outputs?.map(output => ({
        id: output.id,
        name: output.name,
        type: output.type,
        description: output.description
      }))
    };

    return arazzoWorkflow;
  };

  const arazzoWorkflow = convertToArazzo();
  const arazzoJson = JSON.stringify(arazzoWorkflow, null, 2);

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
        Arazzo Pipeline Visualization
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
                {arazzoWorkflow.name}
              </Typography>
              {arazzoWorkflow.description && (
                <Typography variant="body2" gutterBottom>
                  {arazzoWorkflow.description}
                </Typography>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Steps:
                </Typography>
                {arazzoWorkflow.steps.map(step => (
                  <Paper 
                    key={step.id} 
                    sx={{ 
                      p: 2, 
                      mb: 2, 
                      border: '1px solid',
                      borderColor: step.type === 'operation' ? '#2196f3' : 
                                  step.type === 'input' ? '#4caf50' : '#f44336',
                      borderRadius: 1
                    }}
                  >
                    <Typography variant="subtitle2">
                      {step.name} ({step.type})
                    </Typography>
                    {step.operation && (
                      <Typography variant="body2">
                        {step.operation.method.toUpperCase()} {step.operation.path}
                      </Typography>
                    )}
                    {step.inputs && step.inputs.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Inputs:
                        </Typography>
                        {step.inputs.map(input => (
                          <Typography key={input.id} variant="body2" sx={{ ml: 2 }}>
                            {input.name}: {input.type}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {step.outputs && step.outputs.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Outputs:
                        </Typography>
                        {step.outputs.map(output => (
                          <Typography key={output.id} variant="body2" sx={{ ml: 2 }}>
                            {output.name}: {output.type}
                          </Typography>
                        ))}
                      </Box>
                    )}
                    {step.next && step.next.length > 0 && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                          Next Steps:
                        </Typography>
                        <Typography variant="body2" sx={{ ml: 2 }}>
                          {step.next.join(', ')}
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