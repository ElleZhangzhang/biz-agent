import './App.css'
import OverviewPanel from '@/components/OverviewPanel';
import OrderTable from '@/components/OrderTable';

function App() {
  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 24 }}>
      <h2>业务总览</h2>
      <OverviewPanel />
      <h2 style={{ marginTop: 32 }}>订单列表</h2>
      <OrderTable />
    </div>
  );
}

export default App;
