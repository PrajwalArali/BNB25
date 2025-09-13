import React, { useState } from 'react';
import { ClerkProvider, SignIn, SignUp, useUser } from '@clerk/clerk-react';
import MainApp from './components/MainApp';
import './App.css';

const clerkPubKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

function App() {
  const [showSignUp, setShowSignUp] = useState(false);

  if (!clerkPubKey) {
    return (
      <div className="error-message">
        <h2>Configuration Error</h2>
        <p>Please set your Clerk publishable key in the environment variables.</p>
        <p>Create a .env.local file with: REACT_APP_CLERK_PUBLISHABLE_KEY=your_key_here</p>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPubKey}>
      <AppContent showSignUp={showSignUp} setShowSignUp={setShowSignUp} />
    </ClerkProvider>
  );
}

function AppContent({ showSignUp, setShowSignUp }) {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) {
    return <div className="loading">Loading...</div>;
  }

  if (!isSignedIn) {
    return (
      <div className="auth-container">
        <div className="auth-header">
          <h1>Ledger System</h1>
        </div>
        
        <div className="auth-tabs">
          <button 
            className={`auth-tab ${!showSignUp ? 'active' : ''}`}
            onClick={() => setShowSignUp(false)}
          >
            Sign In
          </button>
          <button 
            className={`auth-tab ${showSignUp ? 'active' : ''}`}
            onClick={() => setShowSignUp(true)}
          >
            Sign Up
          </button>
        </div>

        <div className="auth-content">
          {showSignUp ? <SignUp /> : <SignIn />}
        </div>
      </div>
    );
  }

  return <MainApp />;
}

export default App;