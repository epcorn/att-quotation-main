/* eslint-disable react/prop-types */
import { Table, Button } from "flowbite-react";
import { MdDelete } from "react-icons/md";

function InfoDisplay({ infoArray, onDelete, docType }) {
  if (infoArray.length === 0) return null;

  const requiredFields = {
    standard: ["workAreaType", "workArea", "serviceRate", "chemical"],
    "supply/apply": [
      "workAreaType",
      "workArea",
      "chemicalRate",
      "chemicalQuantity",
      "chemical",
      "applyRate",
    ],
    supply: ["workAreaType", "chemicalRate", "chemicalQuantity", "chemical"],
  };

  const fieldLabels = {
    workAreaType: "Work Area Type",
    workArea: "Work Area",
    serviceRate: "Service Rate",
    chemical: "Chemical",
    chemicalRate: "Chemical Rate",
    chemicalQuantity: "Quantity",
    applyRate: "Apply Rate",
  };

  const renderTableHeaders = () => {
    const fields = requiredFields[docType];
    return (
      <Table.Head>
        <Table.HeadCell>No.</Table.HeadCell>
        {fields.map((field, index) => (
          <Table.HeadCell key={index}>{fieldLabels[field]}</Table.HeadCell>
        ))}
        <Table.HeadCell>Action</Table.HeadCell>
      </Table.Head>
    );
  };

  const renderTableRow = (info, index) => {
    const fields = requiredFields[docType];
    return (
      <Table.Row
        key={index}
        className="bg-white dark:border-gray-700 dark:bg-gray-800"
      >
        <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">
          {index + 1}
        </Table.Cell>
        {fields.map((field, fieldIndex) => (
          <Table.Cell key={fieldIndex}>
            {field === "workAreaType"
              ? info[field]
              : `${info[field] || ""} ${info[`${field}Unit`] || ""}`}
          </Table.Cell>
        ))}
        <Table.Cell>
          <Button
            gradientMonochrome="failure"
            className="rounded-full"
            onClick={() => onDelete(info.workAreaType)}
          >
            <MdDelete size="15px" />
          </Button>
        </Table.Cell>
      </Table.Row>
    );
  };

  return (
    <div className="overflow-x-auto">
      <Table striped>
        {renderTableHeaders()}
        <Table.Body className="divide-y">
          {infoArray.map(renderTableRow)}
        </Table.Body>
      </Table>
    </div>
  );
}

export default InfoDisplay;
