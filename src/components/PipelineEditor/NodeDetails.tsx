import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Divider,
  List, 
  ListItem, 
  ListItemText,
  IconButton,
  Tooltip,
  Collapse
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import type { PipelineNode } from '../../types';
import { usePipeline } from '../../contexts/PipelineContext';

interface NodeDetailsProps {
  node: PipelineNode;
}

const NodeDetails: React.FC<NodeDetailsProps> = ({ node }) => {
  const { updateNode, removeNode } = usePipeline();
  const [editingInput, setEditingInput] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [expandedOutputGroups, setExpandedOutputGroups] = useState<Record<string, boolean>>({});

  if (!node) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="body1">No node selected</Typography>
      </Box>
    );
  }

  const { data } = node;
  const { endpoint, inputs, outputs } = data;

  const handleDeleteNode = () => {
    removeNode(node.id);
  };

  const handleEditInput = (inputId: string, currentValue: any) => {
    // Find the input to edit
    const input = inputs.find(input => input.id === inputId);

    if (!input) return;

    // Process the current value based on input type
    let processedValue = currentValue || '';

    // For array inputs, join array elements with newlines
    if (input.type === 'array' && Array.isArray(currentValue)) {
      processedValue = currentValue.join('\n');
    }

    setEditingInput(inputId);
    setInputValue(processedValue);
  };

  const handleSaveInput = (inputId: string) => {
    // Find the input being edited
    const input = inputs.find(input => input.id === inputId);

    if (!input) return;

    // Process the value based on input type
    let processedValue = inputValue;

    // For array inputs, split by newlines and filter out empty lines
    if (input.type === 'array') {
      processedValue = inputValue
        .split('\n')
        .map(item => item.trim())
        .filter(item => item !== '');
    }

    // Update the input value in the node
    const updatedInputs = inputs.map(input => 
      input.id === inputId 
        ? { ...input, value: processedValue } 
        : input
    );

    updateNode(node.id, { inputs: updatedInputs });
    setEditingInput(null);
  };

  const handleCancelEdit = () => {
    setEditingInput(null);
  };

  const toggleOutputGroup = (statusCode: string) => {
    setExpandedOutputGroups(prev => ({
      ...prev,
      [statusCode]: !prev[statusCode]
    }));
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Node Details</Typography>
        <Tooltip title="Delete Node">
          <IconButton color="error" onClick={handleDeleteNode}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Endpoint Information */}
      {endpoint && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Endpoint
          </Typography>
          <Typography variant="body2">
            <strong>Method:</strong> {endpoint.method.toUpperCase()}
          </Typography>
          <Typography variant="body2">
            <strong>Path:</strong> {endpoint.path}
          </Typography>
          {endpoint.summary && (
            <Typography variant="body2">
              <strong>Summary:</strong> {endpoint.summary}
            </Typography>
          )}
          {endpoint.description && (
            <Typography variant="body2">
              <strong>Description:</strong> {endpoint.description}
            </Typography>
          )}
        </Box>
      )}

      <Divider sx={{ mb: 2 }} />

      {/* Inputs */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Inputs
        </Typography>
        {inputs.length > 0 ? (
          <List dense>
            {inputs.map((input) => (
              <ListItem 
                key={input.id}
                secondaryAction={
                  editingInput === input.id ? (
                    <>
                      <IconButton edge="end" onClick={() => handleSaveInput(input.id)}>
                        <SaveIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" onClick={handleCancelEdit}>
                        <CancelIcon fontSize="small" />
                      </IconButton>
                    </>
                  ) : (
                    input.connected ? (
                      <Tooltip title="This input is connected to an output and cannot be edited manually">
                        <span>
                          <IconButton edge="end" disabled>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </span>
                      </Tooltip>
                    ) : (
                      <IconButton edge="end" onClick={() => handleEditInput(input.id, input.value)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    )
                  )
                }
              >
                {editingInput === input.id ? (
                  input.type === 'array' ? (
                    <Box>
                      <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                        {input.name} (Array)
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        variant="outlined"
                        placeholder="Enter array items (one per line)"
                        multiline
                        rows={4}
                        autoFocus
                      />
                    </Box>
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      label={input.name}
                      variant="outlined"
                      autoFocus
                    />
                  )
                ) : (
                  <ListItemText
                    primary={input.name}
                    secondary={
                      <>
                        {input.connected ? (
                          <Typography component="span" variant="body2" color="text.primary">
                            (Connected to output)
                          </Typography>
                        ) : input.type === 'array' && Array.isArray(input.value) ? (
                          <Box sx={{ border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 1, p: 1, mt: 1, mb: 1 }}>
                            <Typography component="span" variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              Array items:
                            </Typography>
                            {input.value.length > 0 ? input.value.map((item, index) => (
                              <Typography key={index} component="div" variant="body2" color="text.primary">
                                {item}
                              </Typography>
                            )) : (
                              <Typography component="div" variant="body2" color="text.secondary">
                                (Empty array)
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography component="span" variant="body2" color="text.primary">
                            {input.value || '(Not set)'}
                          </Typography>
                        )}
                        <br />
                        <Typography component="span" variant="caption">
                          Type: {input.type} | {input.required ? 'Required' : 'Optional'}
                          {input.location && ` | ${input.location.charAt(0).toUpperCase() + input.location.slice(1)} parameter`}
                        </Typography>
                      </>
                    }
                  />
                )}
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No inputs for this node.
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Outputs - Grouped by Status Code */}
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
          Outputs
        </Typography>
        {outputs.length > 0 ? (
          <List dense>
            {outputs.map((outputGroup, groupIndex) => (
              <React.Fragment key={outputGroup.statusCode}>
                <ListItem 
                  button 
                  onClick={() => toggleOutputGroup(outputGroup.statusCode)}
                  sx={{
                    backgroundColor: outputGroup.statusCode.startsWith('2') ? 'rgba(76, 175, 80, 0.1)' : 
                                    outputGroup.statusCode.startsWith('4') ? 'rgba(244, 67, 54, 0.1)' : 
                                    outputGroup.statusCode.startsWith('5') ? 'rgba(255, 152, 0, 0.1)' : 
                                    'rgba(33, 150, 243, 0.1)',
                    borderRadius: 1,
                    mb: 1
                  }}
                >
                  <ListItemText
                    primary={`Status ${outputGroup.statusCode}`}
                    primaryTypographyProps={{
                      sx: {
                        fontWeight: 'bold',
                        color: outputGroup.statusCode.startsWith('2') ? 'success.main' : 
                               outputGroup.statusCode.startsWith('4') ? 'error.main' : 
                               outputGroup.statusCode.startsWith('5') ? 'warning.main' : 'info.main',
                      }
                    }}
                    secondary={`${outputGroup.items.length} item${outputGroup.items.length !== 1 ? 's' : ''}`}
                  />
                  {expandedOutputGroups[outputGroup.statusCode] ? 
                    <ExpandLessIcon /> : <ExpandMoreIcon />}
                </ListItem>
                <Collapse in={expandedOutputGroups[outputGroup.statusCode] || false} timeout="auto" unmountOnExit>
                  <List dense component="div" disablePadding>
                    {outputGroup.items.map((output) => (
                      <ListItem key={output.id} sx={{ pl: 4 }}>
                        <ListItemText
                          primary={output.name}
                          secondary={
                            <>
                              <Typography component="span" variant="caption">
                                Type: {output.type}
                              </Typography>
                              {output.schema && (
                                <Typography component="span" variant="caption" sx={{ display: 'block' }}>
                                  Schema: {output.schema.type === 'object' ? 'Object' : 
                                          output.schema.type === 'array' ? 'Array' : 
                                          output.schema.type}
                                </Typography>
                              )}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              </React.Fragment>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary">
            No outputs for this node.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default NodeDetails;
