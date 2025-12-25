export default function TaskCard({ task }) {
    return (
      <div className="flex items-center justify-between border rounded-lg p-3">
        <div>
          <h4 className="font-medium">{task.title}</h4>
          <p className="text-sm text-gray-500">{task.location}</p>
        </div>
  
        <div className="text-right">
          <p className="font-semibold">{task.price}</p>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {task.status}
          </span>
        </div>
      </div>
    );
  }
  