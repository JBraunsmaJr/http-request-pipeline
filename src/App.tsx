import { ThemeProvider } from './contexts/ThemeContext';
import { PipelineProvider } from './contexts/PipelineContext';
import MainPage from './components/MainPage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <PipelineProvider>
        <MainPage />
      </PipelineProvider>
    </ThemeProvider>
  );
}

export default App;
