import Navbar from './components/Sidebar';

function App() {
  return (
    <div className="min-h-screen min-w-screen bg-gray-50">
      <Navbar />
      <main className="p-6">
        <h1 className="text-2xl font-bold mb-4">Tables</h1>
        {/* Your page content here */}
      </main>
    </div>
  );
}

export default App
