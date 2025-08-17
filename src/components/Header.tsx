import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const Header = () => {
  const { currentUser, signInWithGoogle, logout } = useAuth();

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      toast.success('Signed in successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign in.');
    }
  };

  const handleSignOut = async () => {
    try {
      await logout();
      toast.success('Signed out successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to sign out.');
    }
  };

  return (
    <header className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link to="/" className="text-2xl font-bold">StegaWeb</Link>
          <p className="hidden md:block">Hide your secrets in plain sight.</p>
        </div>
        <nav className="flex items-center space-x-4">
          <Link to="/about" className="hover:text-gray-300">About</Link>
          <Link to="/contact" className="hover:text-gray-300">Contact</Link>
          {currentUser ? (
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={handleSignIn}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Sign In with Google
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
