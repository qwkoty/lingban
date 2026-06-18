import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './theme/ThemeContext';
import { SplashScreen } from './screens/SplashScreen';
import { AgentsListScreen } from './screens/AgentsListScreen';
import { AgentEditScreen } from './screens/AgentEditScreen';
import { ChatScreen } from './screens/ChatScreen';
import { ProfileScreen } from './screens/ProfileScreen';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/agents" element={<AgentsListScreen />} />
          <Route path="/agents/new" element={<AgentEditScreen />} />
          <Route path="/agents/edit/:id" element={<AgentEditScreen />} />
          <Route path="/chat/:id" element={<ChatScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
