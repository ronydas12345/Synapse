export default function App() {
  return (
    <div style={{ 
      backgroundColor: '#0f172a', 
      color: '#00ff00', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      padding: '20px',
      fontSize: '32px',
      fontFamily: 'monospace',
      textAlign: 'center'
    }}>
      <h1>✓ REACT IS WORKING</h1>
      <p style={{ fontSize: '18px', marginTop: '20px' }}>If you see this, React mounted successfully!</p>
      <p style={{ fontSize: '14px', color: '#00aa00', marginTop: '40px' }}>The white screen issue is caused by one of the component imports.</p>
    </div>
  );
}
