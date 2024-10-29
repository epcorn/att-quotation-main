import { unwrapResult } from "@reduxjs/toolkit";
import { Button } from "flowbite-react";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getdcs } from "../redux/contract/contractSlice";
import { CustomModal, DCForm } from "../components/index.js";
// eslint-disable-next-line react/prop-types
function PrintDC({ id, quoteInfo }) {
  const [dcs, setDCs] = useState([]);
  const [form, setForm] = useState(false);
  const [detailModel, setDetailModel] = useState(false);
  const [selectedDc, setSelectedDc] = useState(null);
  const dispatch = useDispatch();
  useEffect(() => {
    //fetch workLogs
    async function fetch() {
      const actionResult = await dispatch(getdcs(id));
      const result = unwrapResult(actionResult);
      setDCs(result.result.dcs);
    }
    fetch();
  }, [dispatch, id]);
  const openWorklogModal = (log) => {
    setSelectedDc(log);
    setDetailModel(true);
  };
  return (
    <div className=" max-w-[1400px] mx-auto  ">
      <h4 className="text-lg font-semibold mb-2">DC s</h4>
      <Button onClick={() => setForm(true)}>Make DC</Button>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
        {dcs?.map((log) => (
          <div
            key={log._id}
            className={`p-4 bg-gray-100 rounded-lg cursor-pointer border transition-all duration-300 ease-in-out ${
              selectedDc?._id === log._id
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
        onClose={() => [setDetailModel(false), setSelectedDc(null)]}
        heading="DC Details"
        bg="bg-teal-50"
      >
        {selectedDc && (
          <div className="flex flex-col p-4 bg-gray-100 rounded-lg col-span-3">
            <div className="mb-2">
              <p className="font-semibold">{selectedDc.workAreaType}</p>
              <p>Chemical: {selectedDc.chemical}</p>
              <p>Batch Number: {selectedDc.batchNumber}</p>
              <p>Quantity: {selectedDc.chemicalqty}</p>
              <p>Packaging: {selectedDc.packaging}</p>

              {selectedDc.remark && <p>Remark: {selectedDc.remark}</p>}
            </div>
            <div className="flex justify-between">
              {/* <Button size="sm">Edit</Button>
            <Button size="sm" color="failure">
              Delete
            </Button> */}
            </div>
          </div>
        )}
      </CustomModal>
      <CustomModal
        isOpen={form}
        onClose={() => setForm(!form)}
        heading="WorkLogs Entry"
        bg="bg-teal-50"
      >
        <DCForm
          id={id}
          quoteInfo={quoteInfo}
          setDCs={setDCs}
          onClose={() => setForm(!form)}
        />
      </CustomModal>
    </div>
  );
}

export default PrintDC;
