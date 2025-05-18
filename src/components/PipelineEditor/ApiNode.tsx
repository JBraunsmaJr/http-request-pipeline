import React, { memo, useState } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
    Box,
    Typography,
    Paper,
    Chip,
    Divider,
    TextField,
    IconButton,
    Tooltip,
    Modal, Button
} from '@mui/material';
import { 
  Delete as DeleteIcon,
  CallSplit as SplitIcon,
  Output as OutputIcon
} from '@mui/icons-material';
import type { PipelineNode } from '../../types';
import {usePipeline} from '../../contexts/PipelineContext';
import { useTheme } from '../../contexts/ThemeContext';
import SchemaObjectSplitter from './SchemaObjectSplitter';

const ApiNode = ({ id, data }: NodeProps<PipelineNode['data']>) => {
  const { removeNode, setSelectedNode, nodes, promoteOutputToPipelineOutput, updateNode } = usePipeline();
  const { darkMode } = useTheme();

  // State for schema splitter modal
  const [splitterOpen, setSplitterOpen] = useState(false);
  const [selectedOutput, setSelectedOutput] = useState<{ groupIndex: number; itemIndex: number } | null>(null);

  // State for promote output modal
  const [promoteOpen, setPromoteOpen] = useState(false);
  const [outputToPromote, setOutputToPromote] = useState<{ groupIndex: number; itemIndex: number } | null>(null);
  const [promotedOutputName, setPromotedOutputName] = useState('');

  const node = nodes.find(n => n.id === id) as PipelineNode;

  const handleNodeClick = () => {
    setSelectedNode(node);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  // Handler for opening the schema splitter
  const handleOpenSplitter = (groupIndex: number, itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOutput({ groupIndex, itemIndex });
    setSplitterOpen(true);
  };

  // Handler for closing the schema splitter
  const handleCloseSplitter = () => {
    setSplitterOpen(false);
    setSelectedOutput(null);
  };

  // Handler for opening the promote output modal
  const handleOpenPromote = (groupIndex: number, itemIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const output = data.outputs[groupIndex].items[itemIndex];
    setOutputToPromote({ groupIndex, itemIndex });
    setPromotedOutputName(output.name);
    setPromoteOpen(true);
  };

  // Handler for closing the promote output modal
  const handleClosePromote = () => {
    setPromoteOpen(false);
    setOutputToPromote(null);
    setPromotedOutputName('');
  };

  // Handler for promoting an output to a pipeline output
  const handlePromoteOutput = () => {
    if (outputToPromote) {
      const output = data.outputs[outputToPromote.groupIndex].items[outputToPromote.itemIndex];
      promoteOutputToPipelineOutput(id, output.id, promotedOutputName);
      handleClosePromote();
    }
  };

  // Get method color
  const getMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'get': return '#4caf50';
      case 'post': return '#2196f3';
      case 'put': return '#ff9800';
      case 'delete': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  if (!data.endpoint) {
    return (
      <Paper 
        sx={{ 
          padding: 2, 
          minWidth: 200, 
          backgroundColor: darkMode ? '#2d2d2d' : '#fff',
          border: '1px solid #ccc',
          borderRadius: 2
        }}
        onClick={handleNodeClick}
      >
        <Typography variant="body1">Invalid Node</Typography>
      </Paper>
    );
  }

  const { method, path } = data.endpoint;

  return (
    <Paper 
      sx={{ 
        padding: 0, 
        minWidth: 250,
        maxWidth: 300,
        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
        border: `2px solid ${getMethodColor(method)}`,
        borderRadius: 2,
        overflow: 'hidden'
      }}
      onClick={handleNodeClick}
    >
      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: 1,
          backgroundColor: darkMode ? '#3d3d3d' : '#f5f5f5',
          borderBottom: '1px solid rgba(0, 0, 0, 0.12)'
        }}
      >
        <Chip 
          label={method.toUpperCase()} 
          size="small"
          sx={{ 
            backgroundColor: getMethodColor(method),
            color: '#fff',
            fontWeight: 'bold',
            mr: 1
          }}
        />
        <Typography 
          variant="body2" 
          sx={{ 
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {path}
        </Typography>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={handleDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Inputs */}
      {data.inputs.length > 0 && (
        <Box sx={{ p: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            Inputs
          </Typography>
          {data.inputs.map((input) => (
            <Box key={input.id} sx={{ mb: 1, position: 'relative' }}>
              <Handle
                type="target"
                position={Position.Left}
                id={input.id}
                style={{ 
                  background: darkMode ? '#90caf9' : '#1976d2',
                  width: 8,
                  height: 8,
                  top: 'auto',
                  bottom: 'auto',
                  left: -4
                }}
              />
              <Box>
                {input.type === 'array' ? (
                  <Box>
                    <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                      {input.name} (Array)
                    </Typography>
                    <Box 
                      sx={{ 
                        border: '1px solid rgba(0, 0, 0, 0.23)', 
                        borderRadius: 1, 
                        p: 1,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)'
                      }}
                    >
                      <Typography variant="caption" sx={{ display: 'block', mb: 1, color: 'text.secondary' }}>
                        Enter array items (one per line)
                      </Typography>
                      <TextField
                        size="small"
                        fullWidth
                        variant="outlined"
                        placeholder={input.required ? 'Required' : 'Optional'}
                        value={Array.isArray(input.value) ? input.value.join('\n') : (input.value || '')}
                        onChange={(e) => {
                          const newValue = e.target.value
                            .split('\n')
                            .map(item => item.trim())
                            .filter(item => item !== '');

                          const updatedInputs = data.inputs.map(inp => 
                            inp.id === input.id 
                              ? { ...inp, value: newValue } 
                              : inp
                          );

                          updateNode(id, { inputs: updatedInputs });
                        }}
                        multiline
                        rows={3}
                        sx={{ 
                          '& .MuiOutlinedInput-root': {
                            fontSize: '0.8rem',
                          }
                        }}
                      />
                    </Box>
                  </Box>
                ) : (
                  <TextField
                    size="small"
                    label={input.name}
                    fullWidth
                    variant="outlined"
                    placeholder={input.required ? 'Required' : 'Optional'}
                    value={input.value || ''}
                    onChange={(e) => {
                      const updatedInputs = data.inputs.map(inp => 
                        inp.id === input.id 
                          ? { ...inp, value: e.target.value } 
                          : inp
                      );

                      updateNode(id, { inputs: updatedInputs });
                    }}
                    sx={{ 
                      '& .MuiOutlinedInput-root': {
                        fontSize: '0.8rem',
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '0.8rem',
                      }
                    }}
                  />
                )}
                {input.location && (
                  <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                    {input.location.charAt(0).toUpperCase() + input.location.slice(1)} parameter
                  </Typography>
                )}
              </Box>
            </Box>
          ))}
        </Box>
      )}

      {/* Divider between inputs and outputs */}
      {data.inputs.length > 0 && data.outputs.length > 0 && (
        <Divider />
      )}

      {/* Outputs - Grouped by Status Code */}
      {data.outputs.length > 0 && (
        <Box sx={{ p: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>
            Outputs
          </Typography>

          {data.outputs.map((outputGroup, outputGroupIndex) => (
            <Box key={outputGroup.statusCode} sx={{ mb: 2 }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  display: 'block', 
                  mb: 0.5, 
                  backgroundColor: outputGroup.statusCode.startsWith('2') ? '#e8f5e9' : 
                                  outputGroup.statusCode.startsWith('4') ? '#ffebee' : 
                                  outputGroup.statusCode.startsWith('5') ? '#fbe9e7' : '#e3f2fd',
                  color: outputGroup.statusCode.startsWith('2') ? '#2e7d32' : 
                         outputGroup.statusCode.startsWith('4') ? '#c62828' : 
                         outputGroup.statusCode.startsWith('5') ? '#d84315' : '#1565c0',
                  padding: '2px 6px',
                  borderRadius: 1,
                  fontWeight: 'bold'
                }}
              >
                Status {outputGroup.statusCode}
              </Typography>

              {outputGroup.items.map((output, outputItemIndex) => (
                <Box key={output.id} sx={{ mb: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ pl: 1 }}>
                      {output.name}: <span style={{ opacity: 0.7 }}>{output.type}</span>
                      {output.schema && (output.type === 'object' || output.type === 'array') && (
                        <Tooltip title="Split this object to access individual properties">
                          <IconButton 
                            size="small" 
                            onClick={(e) => handleOpenSplitter(outputGroupIndex, outputItemIndex, e)}
                            sx={{ ml: 1, p: 0.5 }}
                          >
                            <SplitIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Promote to pipeline output">
                        <IconButton 
                          size="small" 
                          onClick={(e) => handleOpenPromote(outputGroupIndex, outputItemIndex, e)}
                          sx={{ ml: 1, p: 0.5 }}
                        >
                          <OutputIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Typography>
                  </Box>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={output.id}
                    style={{ 
                      background: darkMode ? '#f48fb1' : '#d81b60',
                      width: 8,
                      height: 8,
                      top: 'auto',
                      bottom: 'auto',
                      right: -4
                    }}
                  />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      )}

      {/* Schema Splitter Modal */}
      <Modal
        open={splitterOpen}
        onClose={handleCloseSplitter}
        aria-labelledby="schema-splitter-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div>
          {selectedOutput && (
            <SchemaObjectSplitter
              node={node}
              outputGroupIndex={selectedOutput.groupIndex}
              outputItemIndex={selectedOutput.itemIndex}
              onClose={handleCloseSplitter}
            />
          )}
        </div>
      </Modal>

      {/* Promote Output Modal */}
      <Modal
        open={promoteOpen}
        onClose={handleClosePromote}
        aria-labelledby="promote-output-modal"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper sx={{ p: 2, maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Promote to Pipeline Output
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Output Name"
            fullWidth
            value={promotedOutputName}
            onChange={(e) => setPromotedOutputName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleClosePromote} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handlePromoteOutput}
              disabled={!promotedOutputName}
            >
              Promote
            </Button>
          </Box>
        </Paper>
      </Modal>
    </Paper>
  );
};

export default memo(ApiNode);
