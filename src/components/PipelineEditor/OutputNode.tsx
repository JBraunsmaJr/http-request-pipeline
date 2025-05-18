import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton,
  Tooltip
} from '@mui/material';
import { 
  Delete as DeleteIcon
} from '@mui/icons-material';
import type { PipelineNode } from '../../types';
import { usePipeline } from '../../contexts/PipelineContext';
import { useTheme } from '../../contexts/ThemeContext';

const OutputNode = ({ id, data }: NodeProps<PipelineNode['data']>) => {
  const { removeNode, setSelectedNode, nodes } = usePipeline();
  const { darkMode } = useTheme();

  const node = nodes.find(n => n.id === id) as PipelineNode;

  const handleNodeClick = () => {
    setSelectedNode(node);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeNode(id);
  };

  return (
    <Paper 
      sx={{ 
        padding: 0, 
        minWidth: 200,
        maxWidth: 250,
        backgroundColor: darkMode ? '#2d2d2d' : '#fff',
        border: `2px solid #f44336`,
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
        <Typography 
          variant="body2" 
          sx={{ 
            flexGrow: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 'bold'
          }}
        >
          Pipeline Output: {data.label}
        </Typography>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={handleDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Input */}
      <Box sx={{ p: 1 }}>
        <Box sx={{ mb: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Handle
            type="target"
            position={Position.Left}
            id="input"
            style={{ 
              background: darkMode ? '#90caf9' : '#1976d2',
              width: 8,
              height: 8,
              top: 'auto',
              bottom: 'auto',
              left: -4
            }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ pl: 1 }}>
              {data.label}: <span style={{ opacity: 0.7 }}>{data.pipelineOutputType}</span>
            </Typography>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
};

export default memo(OutputNode);