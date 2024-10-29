import { unwrapResult } from "@reduxjs/toolkit";
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getWorklogs } from "../redux/contract/contractSlice";
import { WorklogForm, CustomModal } from "../components/index.js";

// eslint-disable-next-line react/prop-types
function PrintWorkLogs({ id, quoteInfo }) {
  const [workLogs, setWorkLogs] = useState([]);
  const [form, setForm] = useState(false);
  const [detailModel, setDetailModel] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null); // State for selected worklog
  const dispatch = useDispatch();

  useEffect(() => {
    //fetch workLogs
    async function fetch() {
      const actionResult = await dispatch(getWorklogs(id));
      const result = unwrapResult(actionResult);
      setWorkLogs(result.result.worklogs);
    }
    fetch();
  }, [dispatch, id]);

  const openWorklogModal = (log) => {
    setSelectedLog(log);
    setDetailModel(true);
  };

  return (
    <div className="max-w-[1400px] mx-auto p-4">
      <h4 className="text-lg font-semibold mb-4">Worklogs</h4>
      <Button onClick={() => setForm(true)}>Make Worklog</Button>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {workLogs?.map((log) => (
          <div
            key={log._id}
            className={`p-4 bg-gray-100 rounded-lg cursor-pointer border transition-all duration-300 ease-in-out ${
              selectedLog?._id === log._id
                ? "border-blue-500 shadow-lg transform scale-105"
                : "border-blue-300"
            }`}
            onClick={() => openWorklogModal(log)}
          >
            <div className="font-semibold flex items-center justify-start w-full gap-4">
              <p>Date: {new Date(log.createdAt).toLocaleDateString()}</p>
              <p>Time: {new Date(log.createdAt).toLocaleTimeString()}</p>
            </div>
            <p>Entry By: {log.entryBy?.username}</p>
          </div>
        ))}
      </div>
      <CustomModal
        isOpen={detailModel}
        onClose={() => [setDetailModel(false), setSelectedLog(null)]}
        heading="WorkLog Details"
        bg="bg-teal-50"
      >
        {selectedLog && (
          <div>
            <p className="font-semibold">{selectedLog.workAreaType}</p>
            <p>Chemical: {selectedLog.chemical}</p>
            <p>Quantity: {selectedLog.chemicalUsed}</p>
            <p>
              Area Treated: {selectedLog.areaTreated}{" "}
              {selectedLog.areaTreatedUnit}
            </p>
            {selectedLog.remark && <p>Remark: {selectedLog.remark}</p>}
          </div>
        )}
      </CustomModal>
      <CustomModal
        isOpen={form}
        onClose={() => setForm(!form)}
        heading="WorkLogs Entry"
        bg="bg-teal-50"
      >
        <WorklogForm
          id={id}
          quoteInfo={quoteInfo}
          setWorkLogs={setWorkLogs}
          onClose={() => setForm(!form)}
        />
      </CustomModal>
    </div>
  );
}

export default PrintWorkLogs;
