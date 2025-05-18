import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Collapse, 
  TextField,
  InputAdornment,
  Chip,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  Button,
  type SelectChangeEvent
} from '@mui/material';
import { 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon, 
  Search as SearchIcon,
  Add as AddIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import { usePipeline } from '../../contexts/PipelineContext';
import { extractApiEndpoints } from '../../utils/openApiUtils';
import type { ApiEndpoint } from '../../types';
import { useReactFlow } from 'reactflow';

interface EndpointDrawerProps {
  open: boolean;
  onToggle: () => void;
}

const EndpointDrawer: React.FC<EndpointDrawerProps> = ({ open, onToggle }) => {
  const { services, addNode } = usePipeline();
  const reactFlowInstance = useReactFlow();
  const [selectedServiceId, setSelectedServiceId] = useState<string>('');
  const [endpoints, setEndpoints] = useState<ApiEndpoint[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');

  // Group endpoints by path
  const endpointsByPath = endpoints.reduce<Record<string, ApiEndpoint[]>>((acc, endpoint) => {
    if (!acc[endpoint.path]) {
      acc[endpoint.path] = [];
    }
    acc[endpoint.path].push(endpoint);
    return acc;
  }, {});

  // Filter endpoints by search term
  const filteredPaths = Object.keys(endpointsByPath).filter(path => 
    path.toLowerCase().includes(searchTerm.toLowerCase()) ||
    endpointsByPath[path].some(endpoint => 
      endpoint.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (endpoint.summary && endpoint.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (endpoint.description && endpoint.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // Handle service selection
  const handleServiceChange = (event: SelectChangeEvent) => {
    const serviceId = event.target.value;
    setSelectedServiceId(serviceId);
  };

  // Extract endpoints when service changes
  useEffect(() => {
    if (selectedServiceId) {
      const service = services.find(s => s.id === selectedServiceId);
      if (service) {
        const extractedEndpoints = extractApiEndpoints(service.id, service.openApiDocument);
        setEndpoints(extractedEndpoints);
        // Reset expanded paths
        setExpandedPaths({});
      }
    } else {
      setEndpoints([]);
    }
  }, [selectedServiceId, services]);

  // Toggle path expansion
  const togglePathExpansion = (path: string) => {
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  // Handle adding an endpoint to the pipeline at the center of the view
  const handleAddEndpoint = (endpoint: ApiEndpoint) => {
    // Get the current viewport
    const { x, y, zoom } = reactFlowInstance.getViewport();

    // Get the ReactFlow container dimensions
    const reactFlowBounds = document.querySelector('.react-flow')?.getBoundingClientRect();

    if (reactFlowBounds) {
      // Calculate the center position in the flow coordinates
      const center = reactFlowInstance.screenToFlowPosition({
        x: reactFlowBounds.width / 2,
        y: reactFlowBounds.height / 2
      });

      // Add the node with the calculated position
      addNode(endpoint, center);
    } else {
      // Fallback to a default position if the container is not found
      addNode(endpoint, { x: 100, y: 100 });
    }
  };

  // Handle dragging an endpoint
  const handleDragStart = (event: React.DragEvent, endpoint: ApiEndpoint) => {
    // Set the drag data
    event.dataTransfer.setData('application/reactflow/type', 'endpoint');
    event.dataTransfer.setData('application/reactflow/endpoint', JSON.stringify(endpoint));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onToggle}
      variant="temporary"
      sx={{
        width: 300,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 300,
          boxSizing: 'border-box',
          height: '100%'
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">API Endpoints</Typography>
          <IconButton onClick={onToggle}>
            <MenuIcon />
          </IconButton>
        </Box>

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel id="service-select-label">Select Service</InputLabel>
          <Select
            labelId="service-select-label"
            value={selectedServiceId}
            label="Select Service"
            onChange={handleServiceChange}
          >
            <MenuItem value="">
              <em>None</em>
            </MenuItem>
            {services.map(service => (
              <MenuItem key={service.id} value={service.id}>
                {service.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedServiceId && (
          <TextField
            fullWidth
            placeholder="Search endpoints..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />
        )}

        {selectedServiceId ? (
          endpoints.length > 0 ? (
            <Paper sx={{ maxHeight: 'calc(100vh - 250px)', overflow: 'auto' }}>
              <List>
                {filteredPaths.map(path => (
                  <React.Fragment key={path}>
                    <ListItem button onClick={() => togglePathExpansion(path)}>
                      <ListItemText primary={path} />
                      {expandedPaths[path] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </ListItem>
                    <Collapse in={expandedPaths[path]} timeout="auto" unmountOnExit>
                      <List component="div" disablePadding>
                        {endpointsByPath[path].map(endpoint => (
                          <ListItem 
                            key={`${endpoint.path}-${endpoint.method}`} 
                            sx={{ pl: 4 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e, endpoint)}
                          >
                            <ListItemText 
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Chip 
                                    label={endpoint.method.toUpperCase()} 
                                    color={
                                      endpoint.method === 'get' ? 'success' :
                                      endpoint.method === 'post' ? 'primary' :
                                      endpoint.method === 'put' ? 'warning' :
                                      endpoint.method === 'delete' ? 'error' :
                                      'default'
                                    }
                                    size="small"
                                    sx={{ mr: 1 }}
                                  />
                                  <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                                    {endpoint.summary || endpoint.operationId || `${endpoint.method.toUpperCase()} ${endpoint.path}`}
                                  </Typography>
                                </Box>
                              }
                              secondary={endpoint.description}
                              secondaryTypographyProps={{ sx: { fontSize: '0.75rem' } }}
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                aria-label="add"
                                onClick={() => handleAddEndpoint(endpoint)}
                                size="small"
                              >
                                <AddIcon fontSize="small" />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                    </Collapse>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          ) : (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                No endpoints found in the selected service.
              </Typography>
            </Paper>
          )
        ) : (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Select a service to view available endpoints.
            </Typography>
          </Paper>
        )}
      </Box>
    </Drawer>
  );
};

export default EndpointDrawer;
