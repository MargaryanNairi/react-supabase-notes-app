// App.jsx

import { useEffect, useState } from 'react';
import Auth from './Auth';
import Notes from './Notes';
import Tasks from './Tasks';

// ⭐ 1. Load Supabase here
import { supabase } from './supabase';

function App() {
  // Sessions should be null by default;
  const [session, setSession] = useState(false);
  const [hash, setHash] = useState(window.location.hash);

  // ⭐ 2. Load Supabase Auth Session here
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  // Simple page switching: #/tasks shows Tasks, anything else shows Notes
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!session) return <Auth />;
  return hash === '#/tasks' ? <Tasks /> : <Notes />;
}

export default App;
