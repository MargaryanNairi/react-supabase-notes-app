// Tasks.jsx

import { useEffect, useState } from 'react';
import { Trash2, Plus, Footprints, Play, CircleCheck, CalendarClock, Clock } from 'lucide-react';
import Navbar from './Navbar';
import './Tasks.css';
import { supabase } from './supabase';

const STATUSES = [
  { value: 'planned', label: 'On my way', Icon: Footprints },
  { value: 'doing', label: 'Doing now', Icon: Play },
  { value: 'done', label: 'Done', Icon: CircleCheck },
];

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [toast, setToast] = useState(null);

  const showError = (message) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch all tasks (kept outside useEffect so every function can call it)
  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('Tasks')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error(error.message);
      return;
    }
    setTasks(data || []);
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    fetchTasks();
    const interval = setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  // Create task
  const addTask = async (e) => {
    e.preventDefault();
    if (!title.trim() || !deadline) {
      showError('Please enter a title and a deadline');
      return;
    }
    if (!user) {
      showError('You must be logged in');
      return;
    }

    const { data, error } = await supabase
      .from('Tasks')
      .insert([
        {
          title: title.trim(),
          description: description.trim() || null,
          deadline: new Date(deadline).toISOString(),
          user_id: user.id,
          author_email: user.email,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error(error.message);
      showError(error.message);
      return;
    }

    setTitle('');
    setDescription('');
    setDeadline('');
    setTasks((prev) => [data, ...prev]);
  };

  // Change status (any logged-in user can do this)
  const changeStatus = async (id, status) => {
    const { error } = await supabase
      .from('Tasks')
      .update({ status, status_by_email: user?.email })
      .eq('id', id);

    if (error) {
      console.error(error.message);
      showError(error.message);
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, status, status_by_email: user?.email } : t
      )
    );
  };

  // Delete task (only the creator; the database enforces this too)
  const deleteTask = async (id) => {
    const { error } = await supabase.from('Tasks').delete().eq('id', id);

    if (error) {
      console.error(error.message);
      showError(error.message);
      return;
    }

    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <>
      <Navbar />
      <div className="tasks-bg">
        <div className="tasks-container">
          <h2>Tasks</h2>

          <form className="task-form" onSubmit={addTask}>
            <input
              className="task-input"
              type="text"
              placeholder="Task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="task-input task-textarea"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <label className="task-label">
              Deadline
              <input
                className="task-input"
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </label>
            <div className="task-form-actions">
              <button className="task-add-btn" type="submit">
                <Plus size={18} />
                Add Task
              </button>
            </div>
          </form>

          <div className="task-list">
            {tasks.length === 0 && <p className="task-empty">No tasks yet.</p>}

            {tasks.map((task) => {
              const isOwner = user && task.user_id === user.id;
              const overdue =
                task.status !== 'done' && new Date(task.deadline) < new Date();

              return (
                <div key={task.id} className={`task-card status-${task.status}`}>
                  <div className="task-head">
                    <h3>{task.title}</h3>
                    {isOwner && (
                      <button
                        className="task-delete-btn"
                        onClick={() => deleteTask(task.id)}
                        title="Delete task"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {task.description && <p className="task-desc">{task.description}</p>}

                  <div className="task-meta">
                    <span>
                      <Clock size={14} /> Created {new Date(task.created_at).toLocaleString()}
                    </span>
                    <span className={overdue ? 'task-overdue' : ''}>
                      <CalendarClock size={14} /> Deadline {new Date(task.deadline).toLocaleString()}
                      {overdue && ' (overdue)'}
                    </span>
                    {task.author_email && <span>By {task.author_email}</span>}
                  </div>

                  <div className="task-status-row">
                    {STATUSES.map(({ value, label, Icon }) => (
                      <button
                        key={value}
                        className={`task-status-btn ${value} ${
                          task.status === value ? 'active' : ''
                        }`}
                        onClick={() => changeStatus(task.id, value)}
                      >
                        <Icon size={15} />
                        {label}
                      </button>
                    ))}
                  </div>

                  {task.status_by_email && (
                    <small className="task-status-by">
                      Status set by {task.status_by_email}
                    </small>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {toast && <div className="tasks-toast">{toast}</div>}
    </>
  );
}
