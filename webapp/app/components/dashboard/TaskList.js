import TaskCard from "./TaskCard";

const tasks = [
  {
    id: 1,
    title: "Fix AC",
    location: "Delhi",
    price: "₹800",
    status: "Open",
  },
  {
    id: 2,
    title: "Grocery Delivery",
    location: "Noida",
    price: "₹250",
    status: "In Progress",
  },
];

export default function TaskList() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm">
      <h3 className="font-semibold mb-4">Live Tasks</h3>
      <div className="space-y-3">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
