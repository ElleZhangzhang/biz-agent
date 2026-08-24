import './App.css'
import OverviewPanel from '@/components/OverviewPanel';

function App() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h2>业务总览</h2>
      <OverviewPanel />
    </div>
  );
}

export default App;
