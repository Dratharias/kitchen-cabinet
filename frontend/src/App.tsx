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
        {/* Content Browser */}
        <Route path="/" component={() => <Layout><ContentBrowser foods /></Layout>} />
        <Route path="/foods" component={() => <Layout><ContentBrowser foods /></Layout>} />
        <Route path="/feeds" component={() => <Layout><ContentBrowser feeds /></Layout>} />

        {/* Standard routes */}
        <Route path="/login" component={() => (<Layout><LoginForm /></Layout>)} />
        <Route path="/publication/:id" component={() => <Layout><PublicationPage/></Layout>} />
        <Route path="/review/:id" component={() => <Layout><PublicationPage/></Layout>} />
      </ToastProvider>
    </Router>
  );
}

export default App;