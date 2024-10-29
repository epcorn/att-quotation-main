import { FaSync } from "react-icons/fa";

// eslint-disable-next-line react/prop-types
function Refresh({ loading, onRefresh }) {
  return (
    <button
      onClick={onRefresh}
      className={`relative  bg-gradient-to-r from-teal-400 to-blue-500 p-2 rounded-full ${
        loading ? "animate-spin" : ""
      }`}
    >
      <FaSync className="h-5 w-5 text-white" />
    </button>
  );
}

export default Refresh;
