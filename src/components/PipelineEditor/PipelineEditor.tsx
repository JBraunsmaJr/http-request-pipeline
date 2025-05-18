import React, { useCallback, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  ConnectionLineType,
  type Connection,
  useReactFlow
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
  TextField,
  IconButton,
  Fab,
  Tooltip
} from '@mui/material';
import { 
  Save as SaveIcon, 
  Refresh as LoadIcon, 
  Visibility as VisibilityIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { usePipeline } from '../../contexts/PipelineContext';
import { useTheme } from '../../contexts/ThemeContext';
import ApiNode from './ApiNode';
import InputNode from './InputNode';
import OutputNode from './OutputNode';
import NodeDetails from './NodeDetails';
import PipelineIO from './PipelineIO';
import ArazzoViewer from './ArazzoViewer';
import EndpointDrawer from './EndpointDrawer';

// Define node types
const nodeTypes = {
  apiNode: ApiNode,
  inputNode: InputNode,
  outputNode: OutputNode
};

const PipelineEditorContent = () => {
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
    pipeline,
    addInputNode,
    addNode,
    addOutputNode
  } = usePipeline();
  const { darkMode } = useTheme();
  const reactFlowInstance = useReactFlow();

  // State for save/load UI
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pipelineName, setPipelineName] = useState(pipeline.name);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // State for Arazzo viewer
  const [arazzoViewerOpen, setArazzoViewerOpen] = useState(false);

  // State for endpoint drawer
  const [endpointDrawerOpen, setEndpointDrawerOpen] = useState(true);

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

  // Handle drop event for pipeline inputs/outputs and endpoints
  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const reactFlowBounds = event.currentTarget.getBoundingClientRect();
    const type = event.dataTransfer.getData('application/reactflow/type');
    const id = event.dataTransfer.getData('application/reactflow/id');

    // Get the position where the element was dropped
    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top
    });

    if (type === 'pipelineInput') {
      addInputNode(id, position);
    } else if (type === 'pipelineOutput') {
      addOutputNode(id, position);
    } else if (type === 'endpoint') {
      // Handle endpoint drop
      const endpointData = event.dataTransfer.getData('application/reactflow/endpoint');
      if (endpointData) {
        try {
          const endpoint = JSON.parse(endpointData);
          addNode(endpoint, position);
        } catch (error) {
          console.error('Failed to parse endpoint data:', error);
        }
      }
    }
  }, [addInputNode, addOutputNode, addNode, reactFlowInstance]);

  // Handle drag over event
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

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

  // Handle Arazzo viewer open/close
  const handleOpenArazzoViewer = () => {
    setArazzoViewerOpen(true);
  };

  const handleCloseArazzoViewer = () => {
    setArazzoViewerOpen(false);
  };

  // Toggle endpoint drawer
  const toggleEndpointDrawer = () => {
    setEndpointDrawerOpen(prev => !prev);
  };

  return (
    <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex' }}>
      {/* Endpoint Drawer */}
      <EndpointDrawer open={endpointDrawerOpen} onToggle={toggleEndpointDrawer} />

      {/* Main Flow Editor */}
      <Box sx={{ 
        flexGrow: 1, 
        height: '100%', 
        position: 'relative'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onPaneClick={onPaneClick}
          onDrop={onDrop}
          onDragOver={onDragOver}
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
                <IconButton
                  size="small"
                  onClick={toggleEndpointDrawer}
                  sx={{ mr: 1 }}
                  title={endpointDrawerOpen ? "Hide Endpoints" : "Show Endpoints"}
                >
                  <MenuIcon />
                </IconButton>
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
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<VisibilityIcon />}
                  onClick={handleOpenArazzoViewer}
                >
                  Arazzo
                </Button>
              </Box>
            </Paper>
          </Panel>
        </ReactFlow>
      </Box>

      {/* Node Details Panel or Pipeline IO Panel */}
      <Paper 
        sx={{ 
          width: 300, 
          height: '100%', 
          overflow: 'auto',
          borderLeft: '1px solid',
          borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          backgroundColor: darkMode ? '#1e1e1e' : '#fff',
          display: 'block'
        }}
      >
        {selectedNode ? (
          <NodeDetails node={selectedNode} />
        ) : (
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Pipeline Configuration</Typography>
            <PipelineIO type="inputs" />
            <PipelineIO type="outputs" />
          </Box>
        )}
      </Paper>

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

      {/* Arazzo Viewer */}
      <ArazzoViewer 
        open={arazzoViewerOpen} 
        onClose={handleCloseArazzoViewer} 
      />

      {/* Floating Action Button for Endpoint Drawer */}
      {!endpointDrawerOpen && (
        <Tooltip title="Show API Endpoints">
          <Fab
            color="primary"
            size="medium"
            onClick={toggleEndpointDrawer}
            sx={{
              position: 'absolute',
              left: 20,
              top: 180,
              zIndex: 1000
            }}
          >
            <MenuIcon />
          </Fab>
        </Tooltip>
      )}
    </Box>
  );
};

const PipelineEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <PipelineEditorContent />
    </ReactFlowProvider>
  );
};

export default PipelineEditor;
