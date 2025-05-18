import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Button, 
  TextField, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  DragIndicator as DragIcon
} from '@mui/icons-material';
import { usePipeline } from '../../contexts/PipelineContext';
import type { PipelineIO as PipelineIOType } from '../../types';

interface PipelineIOProps {
  type: 'inputs' | 'outputs';
}

const PipelineIO: React.FC<PipelineIOProps> = ({ type }) => {
  const { 
    pipeline, 
    addPipelineInput, 
    updatePipelineInput, 
    removePipelineInput,
    addPipelineOutput,
    updatePipelineOutput,
    removePipelineOutput
  } = usePipeline();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PipelineIOType | null>(null);
  const [name, setName] = useState('');
  const [itemType, setItemType] = useState('string');
  const [description, setDescription] = useState('');
  const [value, setValue] = useState('');

  const items = type === 'inputs' ? pipeline.inputs || [] : pipeline.outputs || [];
  const isInputs = type === 'inputs';

  const handleOpenDialog = (item?: PipelineIOType) => {
    if (item) {
      // Editing existing item
      setEditingItem(item);
      setName(item.name);
      setItemType(item.type);
      setDescription(item.description || '');
      setValue(item.value !== undefined ? String(item.value) : '');
    } else {
      // Adding new item
      setEditingItem(null);
      setName('');
      setItemType('string');
      setDescription('');
      setValue('');
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSave = () => {
    const newItem = {
      name,
      type: itemType,
      description,
      value: value !== '' ? value : undefined
    };

    if (editingItem) {
      // Update existing item
      if (isInputs) {
        updatePipelineInput(editingItem.id, newItem);
      } else {
        updatePipelineOutput(editingItem.id, newItem);
      }
    } else {
      // Add new item
      if (isInputs) {
        addPipelineInput(newItem);
      } else {
        addPipelineOutput(newItem);
      }
    }

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (isInputs) {
      removePipelineInput(id);
    } else {
      removePipelineOutput(id);
    }
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Pipeline {isInputs ? 'Inputs' : 'Outputs'}
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add {isInputs ? 'Input' : 'Output'}
        </Button>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {items.length > 0 ? (
        <List dense>
          {items.map((item) => (
            <ListItem
              key={item.id}
              secondaryAction={
                <>
                  <IconButton edge="end" onClick={() => handleOpenDialog(item)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton edge="end" onClick={() => handleDelete(item.id)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </>
              }
              sx={{ cursor: 'grab' }}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow/type', isInputs ? 'pipelineInput' : 'pipelineOutput');
                e.dataTransfer.setData('application/reactflow/id', item.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <DragIcon fontSize="small" sx={{ mr: 1, opacity: 0.5, cursor: 'grab' }} />
                <ListItemText
                  primary={item.name}
                  secondary={
                  <>
                    <Typography component="span" variant="body2">
                      Type: {item.type}
                    </Typography>
                    {item.description && (
                      <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                        Description: {item.description}
                      </Typography>
                    )}
                    {item.value !== undefined && (
                      <Typography component="span" variant="body2" sx={{ display: 'block' }}>
                        Default Value: {String(item.value)}
                      </Typography>
                    )}
                  </>
                }
              />
              </Box>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No {isInputs ? 'inputs' : 'outputs'} defined for this pipeline.
        </Typography>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingItem ? `Edit ${isInputs ? 'Input' : 'Output'}` : `Add ${isInputs ? 'Input' : 'Output'}`}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Type</InputLabel>
            <Select
              value={itemType}
              label="Type"
              onChange={(e) => setItemType(e.target.value)}
            >
              <MenuItem value="string">String</MenuItem>
              <MenuItem value="number">Number</MenuItem>
              <MenuItem value="boolean">Boolean</MenuItem>
              <MenuItem value="object">Object</MenuItem>
              <MenuItem value="array">Array</MenuItem>
            </Select>
          </FormControl>
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Default Value"
            fullWidth
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={!name}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default PipelineIO;
