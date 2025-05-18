import React, { useState } from 'react';
import { Box, Tabs, Tab } from '@mui/material';
import { 
  Api as ApiIcon, 
  AccountTree as PipelineIcon 
} from '@mui/icons-material';
import Layout from '../Layout';
import ServiceManager from '../ServiceManager';
import EndpointSelector from '../EndpointSelector';
import PipelineEditor from '../PipelineEditor';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      style={{ height: 'calc(100% - 48px)' }}
    >
      {value === index && (
        <Box sx={{ p: 3, height: '100%' }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const MainPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Layout>
      <Box sx={{ width: '100%', height: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="pipeline editor tabs"
          >
            <Tab 
              icon={<ApiIcon />} 
              label="API Services" 
              id="tab-0" 
              aria-controls="tabpanel-0" 
            />
            <Tab 
              icon={<PipelineIcon />} 
              label="Pipeline Editor" 
              id="tab-1" 
              aria-controls="tabpanel-1" 
            />
          </Tabs>
        </Box>
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', height: '100%' }}>
            <Box sx={{ width: '50%', pr: 2 }}>
              <ServiceManager />
            </Box>
            <Box sx={{ width: '50%', pl: 2 }}>
              <EndpointSelector />
            </Box>
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <PipelineEditor />
        </TabPanel>
      </Box>
    </Layout>
  );
};

export default MainPage;