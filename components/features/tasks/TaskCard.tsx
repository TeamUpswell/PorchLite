import React from 'react';

// Define the props for the TaskCard component
interface TaskCardProps {
  title: string; // Title of the task
  description: string; // Description of the task
  dueDate: string; // Due date of the task
  completed: boolean; // Task completion status
  onToggleComplete: () => void; // Function to toggle task completion
}

// TaskCard component to display individual tasks
const TaskCard: React.FC<TaskCardProps> = ({ title, description, dueDate, completed, onToggleComplete }) => {
  return (
    <div className={`p-4 border rounded-lg shadow-md ${completed ? 'bg-green-100' : 'bg-white'}`}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
      <p className="text-sm text-gray-500">Due: {dueDate}</p>
      <button
        onClick={onToggleComplete}
        className={`mt-2 px-4 py-2 rounded ${completed ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
      >
        {completed ? 'Mark as Incomplete' : 'Mark as Complete'}
      </button>
    </div>
  );
};

export default TaskCard;