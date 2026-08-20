import { useState, useEffect } from 'react';

const TodoApp = () => {
  const [tasks, setTasks] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    const savedTodos = localStorage.getItem('todoList');
    if (savedTodos) {
      setTasks(JSON.parse(savedTodos));
    }
  }, []);

  const saveToLocalStorage = () => {
    localStorage.setItem('todoList', JSON.stringify(tasks));
  };

  const addTask = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setTasks([...tasks, { id: Date.now(), text: inputText, completed: false }]);
    setInputText('');
    saveToLocalStorage();
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ));
    saveToLocalStorage();
  };

  const deleteTask = (e, id) => {
    e.stopPropagation();
    setTasks(tasks.filter(task => task.id !== id));
    saveToLocalStorage();
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Todo App</h1>
        
        <form onSubmit={addTask} className="mb-6">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Add a new task..."
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          />
        </form>

        <div className="space-y-3">
          {tasks.map(task => (
            <div 
              key={task.id}
              className={`p-4 rounded-lg flex justify-between items-center ${
                task.completed ? 'bg-gray-100' : 'bg-white'
              } transition duration-200 hover:bg-blue-50`}
            >
              <span 
                className={`text-left flex-grow text-sm ${
                  task.completed ? 'line-through text-gray-400' : 'text-gray-700'
                }`}
              >
                {task.text}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleTask(task.id)}
                  className="p-1 hover:bg-gray-200 rounded-full text-blue-500"
                >
                  {task.completed ? '✓' : '✕'}
                </button>
                <button
                  onClick={(e) => deleteTask(e, task.id)}
                  className="p-1 hover:bg-gray-200 rounded-full text-red-500"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TodoApp;