import { useState } from "react";
import { useDispatch } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { docxData } from "../redux/contract/contractSlice.js";

import { Button } from "flowbite-react";
import { generateStandardContractAdv } from "./AnnexureTable.jsx";

// eslint-disable-next-line react/prop-types, no-unused-vars
const ContractGenerator = ({ id, color, onClick, text, annexure }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();
  const generateContract = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Fetch data from backend
      const actionResult = await dispatch(docxData(id));
      const result = unwrapResult(actionResult);
      const data = result.result;
      await generateStandardContractAdv(data, annexure);
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Button
        color={color}
        onClick={() => [generateContract(), onClick()]}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : `${text}`}
      </Button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default ContractGenerator;
