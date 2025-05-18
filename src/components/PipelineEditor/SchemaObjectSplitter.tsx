import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Collapse, 
  IconButton, 
  Button,
  Checkbox,
  TextField
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { v4 as uuidv4 } from 'uuid';
import { usePipeline } from '../../contexts/PipelineContext';
import type { PipelineNode } from '../../types';

interface SchemaObjectSplitterProps {
  node: PipelineNode;
  outputGroupIndex: number;
  outputItemIndex: number;
  onClose: () => void;
}

interface SchemaProperty {
  name: string;
  type: string;
  path: string[];
  properties?: SchemaProperty[];
  isExpanded?: boolean;
  isSelected?: boolean;
}

const SchemaObjectSplitter: React.FC<SchemaObjectSplitterProps> = ({ 
  node, 
  outputGroupIndex, 
  outputItemIndex, 
  onClose 
}) => {
  const { updateNode } = usePipeline();
  const outputGroup = node.data.outputs[outputGroupIndex];
  const outputItem = outputGroup.items[outputItemIndex];
  
  // Extract schema properties recursively
  const extractSchemaProperties = (schema: any, basePath: string[] = []): SchemaProperty[] => {
    const properties: SchemaProperty[] = [];
    
    if (schema.type === 'object' && schema.properties) {
      Object.entries(schema.properties).forEach(([propName, propSchema]: [string, any]) => {
        const path = [...basePath, propName];
        const property: SchemaProperty = {
          name: propName,
          type: propSchema.type || 'unknown',
          path,
          isExpanded: false,
          isSelected: false
        };
        
        if (propSchema.type === 'object' && propSchema.properties) {
          property.properties = extractSchemaProperties(propSchema, path);
        } else if (propSchema.type === 'array' && propSchema.items) {
          property.properties = [
            {
              name: 'items',
              type: propSchema.items.type || 'unknown',
              path: [...path, 'items'],
              isExpanded: false,
              isSelected: false
            }
          ];
        }
        
        properties.push(property);
      });
    } else if (schema.type === 'array' && schema.items) {
      const itemSchema = schema.items;
      const path = [...basePath, 'items'];
      
      if (itemSchema.type === 'object' && itemSchema.properties) {
        Object.entries(itemSchema.properties).forEach(([propName, propSchema]: [string, any]) => {
          const itemPath = [...path, propName];
          const property: SchemaProperty = {
            name: propName,
            type: propSchema.type || 'unknown',
            path: itemPath,
            isExpanded: false,
            isSelected: false
          };
          
          if (propSchema.type === 'object' && propSchema.properties) {
            property.properties = extractSchemaProperties(propSchema, itemPath);
          }
          
          properties.push(property);
        });
      }
    }
    
    return properties;
  };
  
  const [schemaProperties, setSchemaProperties] = useState<SchemaProperty[]>(
    extractSchemaProperties(outputItem.schema, outputItem.path || [])
  );
  
  const [outputName, setOutputName] = useState<string>('');
  
  // Toggle expansion of a property
  const toggleExpand = (index: number, properties: SchemaProperty[] = schemaProperties) => {
    const newProperties = [...properties];
    newProperties[index] = {
      ...newProperties[index],
      isExpanded: !newProperties[index].isExpanded
    };
    setSchemaProperties(newProperties);
  };
  
  // Toggle selection of a property
  const toggleSelect = (index: number, properties: SchemaProperty[] = schemaProperties) => {
    const newProperties = [...properties];
    newProperties[index] = {
      ...newProperties[index],
      isSelected: !newProperties[index].isSelected
    };
    setSchemaProperties(newProperties);
  };
  
  // Render a property item recursively
  const renderProperty = (property: SchemaProperty, index: number, properties: SchemaProperty[] = schemaProperties) => {
    return (
      <React.Fragment key={property.path.join('.')}>
        <ListItem>
          <ListItemIcon>
            <Checkbox
              edge="start"
              checked={property.isSelected}
              onChange={() => toggleSelect(index, properties)}
            />
          </ListItemIcon>
          <ListItemText 
            primary={property.name} 
            secondary={property.type}
          />
          {property.properties && property.properties.length > 0 && (
            <IconButton onClick={() => toggleExpand(index, properties)}>
              {property.isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
        </ListItem>
        
        {property.properties && property.properties.length > 0 && (
          <Collapse in={property.isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding sx={{ pl: 4 }}>
              {property.properties.map((childProp, childIndex) => 
                renderProperty(childProp, childIndex, property.properties)
              )}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };
  
  // Collect all selected properties (flattened)
  const collectSelectedProperties = (properties: SchemaProperty[] = schemaProperties): SchemaProperty[] => {
    let selected: SchemaProperty[] = [];
    
    properties.forEach(prop => {
      if (prop.isSelected) {
        selected.push(prop);
      }
      
      if (prop.properties && prop.properties.length > 0) {
        selected = [...selected, ...collectSelectedProperties(prop.properties)];
      }
    });
    
    return selected;
  };
  
  // Add selected properties as new outputs
  const addSelectedProperties = () => {
    const selectedProperties = collectSelectedProperties();
    
    if (selectedProperties.length === 0) {
      return;
    }
    
    // Create a copy of the node data
    const newNodeData = { ...node.data };
    const newOutputGroup = { ...outputGroup };
    
    // Add new output items for each selected property
    selectedProperties.forEach(prop => {
      newOutputGroup.items.push({
        id: uuidv4(),
        name: outputName ? `${outputName}.${prop.name}` : prop.name,
        type: prop.type,
        schema: null, // No need to split further
        path: prop.path
      });
    });
    
    // Update the output group
    newNodeData.outputs[outputGroupIndex] = newOutputGroup;
    
    // Update the node
    updateNode(node.id, newNodeData);
    onClose();
  };
  
  return (
    <Paper sx={{ p: 2, maxWidth: 500, maxHeight: 600, overflow: 'auto' }}>
      <Typography variant="h6" gutterBottom>
        Split Schema Object
      </Typography>
      
      <Typography variant="body2" gutterBottom>
        Select properties to extract from {outputItem.name}
      </Typography>
      
      <TextField
        label="Output Name Prefix (optional)"
        fullWidth
        margin="normal"
        value={outputName}
        onChange={(e) => setOutputName(e.target.value)}
        placeholder={outputItem.name}
        helperText="This will be used as a prefix for the extracted properties"
      />
      
      <List>
        {schemaProperties.map((prop, index) => renderProperty(prop, index))}
      </List>
      
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button onClick={onClose} sx={{ mr: 1 }}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={addSelectedProperties}
          disabled={collectSelectedProperties().length === 0}
        >
          Add Selected Properties
        </Button>
      </Box>
    </Paper>
  );
};

export default SchemaObjectSplitter;