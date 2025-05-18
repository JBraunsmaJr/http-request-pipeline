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
    setEditingInput(inputId);
    setInputValue(currentValue || '');
  };

  const handleSaveInput = (inputId: string) => {
    // Update the input value in the node
    const updatedInputs = inputs.map(input => 
      input.id === inputId 
        ? { ...input, value: inputValue } 
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
                  <TextField
                    size="small"
                    fullWidth
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    label={input.name}
                    variant="outlined"
                    autoFocus
                  />
                ) : (
                  <ListItemText
                    primary={input.name}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {input.connected ? '(Connected to output)' : (input.value || '(Not set)')}
                        </Typography>
                        <br />
                        <Typography component="span" variant="caption">
                          Type: {input.type} | {input.required ? 'Required' : 'Optional'}
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
