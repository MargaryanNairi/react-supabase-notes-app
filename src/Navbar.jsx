import { useEffect, useState } from 'react';
import { StickyNote, ListChecks } from 'lucide-react';
import './Navbar.css';
import './NavLinks.css';

// ⭐ 1. Load Supabase here
import { supabase } from './supabase';

export default function Navbar() {
  // Which page is open (based on the address hash: #/tasks or anything else = notes)
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const onTasks = hash === '#/tasks';

  // ⭐ 4. Logout function here
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h1 className="logo">📝 NotesApp</h1>
      </div>
      <div className="navbar-right">
        <a
          href="#/"
          className={`nav-icon-link ${!onTasks ? 'active' : ''}`}
          title="Notes"
        >
          <StickyNote size={20} />
        </a>
        <a
          href="#/tasks"
          className={`nav-icon-link ${onTasks ? 'active' : ''}`}
          title="Tasks"
        >
          <ListChecks size={20} />
        </a>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}
