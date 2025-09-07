import { ToastProvider } from './services/ToastProvider';
import Layout from './views/layout/Layout';

function App() {
  return (
    <>
      <ToastProvider />
      <Layout>
        <main class="">
          Allo
        </main>
      </Layout>
    </>
  );
}

export default App;
