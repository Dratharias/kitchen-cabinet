import { Router, Route } from '@solidjs/router';
import { Layout } from './views/layout/Layout';
import { ToastProvider } from './services/ToastProvider';
import { LoginForm } from './pages/forms/Login';
import { PublicationPage } from './pages/publication/[id]';
import { ContentBrowser } from './pages/ContentBrowser';

function App() {
  return (
    <Router>
      <ToastProvider>
        {/* Home - Default to foods */}
        <Route path="/" component={() => <Layout><ContentBrowser foods /></Layout>} />
        
        {/* Content Browser Routes */}
        <Route path="/foods" component={() => <Layout><ContentBrowser foods /></Layout>} />
        <Route path="/feeds" component={() => <Layout><ContentBrowser feeds /></Layout>} />
        
        {/* Authentication */}
        <Route path="/login" component={() => <Layout><LoginForm /></Layout>} />
        
        {/* Publication Detail Routes */}
        <Route path="/foods/:id" component={() => <Layout><PublicationPage category="foods" /></Layout>} />
        <Route path="/feeds/:id" component={() => <Layout><PublicationPage category="feeds" /></Layout>} />
      </ToastProvider>
    </Router>
  );
}

export default App;