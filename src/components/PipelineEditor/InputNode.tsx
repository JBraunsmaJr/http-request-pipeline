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

const InputNode = ({ id, data }: NodeProps<PipelineNode['data']>) => {
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
        border: `2px solid #4caf50`,
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
          Pipeline Input: {data.label}
        </Typography>
        <Tooltip title="Delete">
          <IconButton size="small" onClick={handleDelete}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Output */}
      <Box sx={{ p: 1 }}>
        <Box sx={{ mb: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="body2" sx={{ pl: 1 }}>
              {data.label}: <span style={{ opacity: 0.7 }}>{data.pipelineInputType}</span>
            </Typography>
          </Box>
          <Handle
            type="source"
            position={Position.Right}
            id="output"
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
      </Box>
    </Paper>
  );
};

export default memo(InputNode);