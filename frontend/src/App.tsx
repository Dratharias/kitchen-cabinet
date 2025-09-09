import { Router, Route } from '@solidjs/router';
import Layout from './views/layout/Layout';
import { ToastProvider } from './services/ToastProvider';
import { ContentBrowser } from './pages/ContentBrowser';
import { LoginForm } from './pages/forms/Login';
import { NavProvider } from './components/navbar/NavContext';

function App() {
  return (
    <Router>
        <ToastProvider>
          {/* Routes */}
          <Route path="/" component={() => <Layout><ContentBrowser feeds /></Layout>} />
          <Route path="/feeds" component={() => <Layout><ContentBrowser feeds /></Layout>} />
          <Route path="/library" component={() => <Layout><ContentBrowser library /></Layout>} />
          <Route path="/login" component={() => (<Layout><LoginForm /></Layout>)}/>
        </ToastProvider>
    </Router>
  );
}

export default App;