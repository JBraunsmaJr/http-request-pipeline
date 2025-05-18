import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  ConnectionLineType,
  type Connection
} from 'reactflow';
import 'reactflow/dist/style.css';
import { 
  Box, 
  Paper, 
  Typography, 
  Button, 
  Snackbar, 
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Save as SaveIcon, Refresh as LoadIcon } from '@mui/icons-material';
import { usePipeline } from '../../contexts/PipelineContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiNode from './ApiNode';
import NodeDetails from './NodeDetails';

// Define node types
const nodeTypes = {
  apiNode: ApiNode
};

const PipelineEditor: React.FC = () => {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    addEdge: addPipelineEdge,
    selectedNode,
    setSelectedNode,
    savePipeline,
    loadPipeline,
    pipeline
  } = usePipeline();
  const { darkMode } = useTheme();

  // State for save/load UI
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pipelineName, setPipelineName] = useState(pipeline.name);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Handle connections between nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Extract source and target information
      const { source, target, sourceHandle, targetHandle } = connection;

      if (source && target && sourceHandle && targetHandle) {
        // Add edge to the pipeline
        addPipelineEdge(source, target, sourceHandle, targetHandle);
      }
    },
    [addPipelineEdge]
  );

  // Handle pane click to deselect nodes
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Handle save dialog open
  const handleOpenSaveDialog = () => {
    setPipelineName(pipeline.name);
    setSaveDialogOpen(true);
  };

  // Handle save dialog close
  const handleCloseSaveDialog = () => {
    setSaveDialogOpen(false);
  };

  // Handle save pipeline
  const handleSavePipeline = () => {
    try {
      savePipeline(pipelineName);
      setSaveDialogOpen(false);
      setSnackbarMessage('Pipeline saved successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to save pipeline');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle load pipeline
  const handleLoadPipeline = () => {
    try {
      const loaded = loadPipeline();
      if (loaded) {
        setSnackbarMessage('Pipeline loaded successfully');
        setSnackbarSeverity('success');
      } else {
        setSnackbarMessage('No saved pipeline found');
        setSnackbarSeverity('error');
      }
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to load pipeline');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex' }}>
      {/* Main Flow Editor */}
      <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            connectionLineType={ConnectionLineType.Bezier}
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
            fitView
            attributionPosition="bottom-right"
            style={{
              backgroundColor: darkMode ? '#121212' : '#f5f5f5'
            }}
          >
            <Background 
              color={darkMode ? '#333' : '#aaa'} 
              gap={16} 
              size={1} 
            />
            <Controls />
            <MiniMap
              nodeStrokeColor={darkMode ? '#555' : '#ddd'}
              nodeColor={darkMode ? '#222' : '#fff'}
              nodeBorderRadius={2}
              maskColor={darkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)'}
            />
            <Panel position="top-right">
              <Paper 
                sx={{ 
                  p: 1, 
                  backgroundColor: darkMode ? '#1e1e1e' : '#fff',
                  boxShadow: 3,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1
                }}
              >
                <Typography variant="body2">
                  Nodes: {nodes.length} | Connections: {edges.length}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<SaveIcon />}
                    onClick={handleOpenSaveDialog}
                  >
                    Save
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LoadIcon />}
                    onClick={handleLoadPipeline}
                  >
                    Load
                  </Button>
                </Box>
              </Paper>
            </Panel>
          </ReactFlow>
        </ReactFlowProvider>
      </Box>

      {/* Node Details Panel */}
      {selectedNode && (
        <Paper 
          sx={{ 
            width: 300, 
            height: '100%', 
            overflow: 'auto',
            borderLeft: '1px solid',
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
            backgroundColor: darkMode ? '#1e1e1e' : '#fff'
          }}
        >
          <NodeDetails node={selectedNode} />
        </Paper>
      )}

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={handleCloseSaveDialog}>
        <DialogTitle>Save Pipeline</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Pipeline Name"
            fullWidth
            value={pipelineName}
            onChange={(e) => setPipelineName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseSaveDialog}>Cancel</Button>
          <Button onClick={handleSavePipeline} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PipelineEditor;
