import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-2xl shadow-lg max-w-md mx-4">
        <div className="text-6xl mb-4">🎮</div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Learning Games</h1>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Class 8</h2>
        <p className="text-lg text-gray-600 mb-8">
          Choose your subject to start learning
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/maths"
            className="block w-full bg-sky-400 hover:bg-sky-500 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200"
          >
            📐 Maths
          </Link>
          
          <Link 
            href="/science"
            className="block w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200"
          >
            🔬 Science
          </Link>
        </div>
      </div>
    </div>
  );
}