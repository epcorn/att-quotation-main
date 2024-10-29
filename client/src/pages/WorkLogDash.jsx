/* eslint-disable react/prop-types */
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MdAccessTime, MdAssignment, MdGroup, MdWarning } from "react-icons/md";
import { useState } from "react";

const WorkLogDash = () => {
  // Simulated data - replace with actual data fetching logic
  const [recentLogs] = useState([
    { id: 1, task: "Project Planning", duration: "2h 30m", date: "2024-10-11" },
    { id: 2, task: "Client Meeting", duration: "1h 15m", date: "2024-10-10" },
    { id: 3, task: "Code Review", duration: "45m", date: "2024-10-09" },
  ]);

  const chartData = [
    { name: "Mon", hours: 6 },
    { name: "Tue", hours: 8 },
    { name: "Wed", hours: 7 },
    { name: "Thu", hours: 9 },
    { name: "Fri", hours: 5 },
  ];

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Work Log Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Hours"
          value="32h 15m"
          icon={<MdAccessTime size={24} />}
        />
        <StatCard
          title="Completed Tasks"
          value="15"
          icon={<MdAssignment size={24} />}
        />
        <StatCard title="Team Members" value="8" icon={<MdGroup size={24} />} />
        <StatCard
          title="Pending Approvals"
          value="3"
          icon={<MdWarning size={24} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Weekly Work Hours</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="hours" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Recent Logs</h2>
          <ul className="space-y-4">
            {recentLogs.map((log) => (
              <li key={log.id} className="border-b pb-2">
                <p className="font-medium">{log.task}</p>
                <p className="text-sm text-gray-600">
                  {log.duration} on {log.date}
                </p>
              </li>
            ))}
          </ul>
          <Link
            to="/work-log"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            View All Logs
          </Link>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="bg-white p-6 rounded-lg shadow flex items-center">
    <div className="mr-4 text-blue-500">{icon}</div>
    <div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
);

export default WorkLogDash;
