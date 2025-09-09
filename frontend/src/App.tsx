import { Router, Route } from '@solidjs/router';
import { Layout } from './views/layout/Layout';
import { ToastProvider } from './services/ToastProvider';
import { LoginForm } from './pages/forms/Login';
import { FeedPage } from './pages/feeds/[id]';
import { LibraryPage }from './pages/library/[id]';
import { ContentBrowser } from './pages/ContentBrowser';

function App() {
  return (
    <Router>
      <ToastProvider>
        <Route path="/" component={() => <Layout><ContentBrowser feeds /></Layout>} />
        <Route path="/feeds" component={() => <Layout><ContentBrowser feeds /></Layout>} />
        <Route path="/feeds/:id" component={() => <Layout><FeedPage /></Layout>} />
        <Route path="/library" component={() => <Layout><ContentBrowser library /></Layout>} />
        <Route path="/library/:id" component={() => <Layout><LibraryPage /></Layout>} />
        <Route path="/login" component={() => (<Layout><LoginForm /></Layout>)} />
      </ToastProvider>
    </Router>
  );
}

export default App;
