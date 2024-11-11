import { isValidObjectId } from "mongoose";
import {
  ChemicalBatchNos,
  Contract,
  DC,
  Quotation,
  QuoteInfo,
  WorkLogs,
} from "../models/index.js";
import {
  differenceBetweenArrays,
  remove_IdFromObj,
  createContractArchiveEntry,
} from "../utils/functions.js";
import fs from "fs";
import ExcelJS from "exceljs";
import brevo from "@getbrevo/brevo";

const create = async (req, res, next) => {
  try {
    const { contract } = req.body;
    const {
      contractNo,
      os,
      contractDate,
      salesPerson,
      billToAddress,
      shipToAddress,
      emailTo,
      note,
      docType,
      quoteInfo,
      workOrderNo,
      workOrderDate,
      gstNo,
      paymentTerms,
    } = contract;
    let quoteInfoIds = [];
    for (let i = 0; i < quoteInfo.length; i++) {
      const quoteData = remove_IdFromObj(quoteInfo[i]);
      const newInfo = await QuoteInfo.create(quoteData);
      quoteInfoIds.push(newInfo._id);
    }
    const newContract = await Contract.create({
      contractNo,
      os,
      contractDate: contractDate || Date.now(),
      salesPerson,
      billToAddress,
      shipToAddress,
      emailTo,
      note,
      docType,
      workOrderDate,
      workOrderNo,
      gstNo,
      paymentTerms,
      quoteInfo: quoteInfoIds,
      createdBy: req.user.id,
    });
    const hmhm = await Contract.findById(newContract._id)
      .populate("quoteInfo")
      .populate("createdBy");
    res.status(200).json({ message: "Contract Created!", result: hmhm });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const contracts = async (req, res, next) => {
  try {
    // Parse and set start and end of the day for fromDate and toDate
    const startOfDay = req.query.fromDate
      ? new Date(req.query.fromDate)
      : new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = req.query.toDate ? new Date(req.query.toDate) : new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const startIndex = parseInt(req.query.startIndex) || 0;
    const limit = parseInt(req.query.limit) || 9;
    const sortDirection = req.query.order === "asc" ? 1 : -1;

    // Build the query object
    const query = {
      ...(req.query.createdBy && {
        createdBy: req.query.createdBy,
      }),
      ...(req.query.projectName && {
        "shipToAddress.projectName": {
          $regex: new RegExp(req.query.projectName, "i"),
        },
      }),
      ...(req.query.clientName && {
        "billToAddress.name": {
          $regex: new RegExp(req.query.clientName, "i"),
        },
      }),
      ...(req.query.contractNo && {
        contractNo: { $regex: new RegExp(req.query.contractNo, "i") },
      }),
      ...(req.query.approved && {
        approved: true,
      }),
    };

    // Add date filters to the query
    if (req.query.fromDate && req.query.toDate) {
      query.contractDate = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    } else if (req.query.fromDate) {
      query.contractDate = {
        $gte: startOfDay,
      };
    } else if (req.query.toDate) {
      query.contractDate = {
        $lte: endOfDay,
      };
    }

    // Fetch the quotes based on the constructed query
    const contracts = await Contract.find(query)
      .lean()
      .populate("createdBy", "username")
      .sort({ updatedAt: sortDirection })
      .skip(startIndex)
      .limit(limit);

    // Get today's date for counting today's quotes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalContracts = await Contract.countDocuments();
    const todayContracts = await Contract.countDocuments({
      createdAt: { $gte: today },
    });
    const approvedCount = await Contract.countDocuments({ approved: true });
    const approvePending = await Contract.countDocuments({
      approved: false,
    });
    res.status(200).json({
      message: "Contracts Retrieved",
      result: contracts,
      totalContracts,
      todayContracts,
      approvedCount,
      approvePending,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const contractify = async (req, res, next) => {
  try {
    const { id } = req.params;
    const quote = await Quotation.findById(id)
      .populate("quoteInfo")
      .populate({ path: "createdBy", select: "-password" })
      .populate({ path: "salesPerson", select: "-password" })
      .populate("createdBy", "username");

    if (quote.contractified) {
      return res
        .status(404)
        .json({ message: "Already Contract, please refresh" });
    }
    if (!quote) {
      return res.status(404).json({ message: "Quotation not found" });
    }
    if (!quote.approved) {
      return res.status(403).json({ message: "Document not approved yet!" });
    }

    const {
      contractNo,
      salesPerson,
      billToAddress,
      shipToAddress,
      emailTo,
      note,
      docType,
      quoteInfo,
      workOrderNo,
      workOrderDate,
      gstNo,
    } = quote;

    // Copying quoteInfo and creating new QuoteInfo documents
    let quoteInfoIds = [];
    for (let i = 0; i < quoteInfo.length; i++) {
      const { _id, __v, ...rest } = quoteInfo[i].toObject();
      const newQuoteInfo = await QuoteInfo.create(rest);
      quoteInfoIds.push(newQuoteInfo._id);
    }

    // Creating the new contract
    const newContract = await Contract.create({
      quotation: quote._id,
      contractNo,
      salesPerson,
      billToAddress,
      shipToAddress,
      emailTo,
      note,
      docType,
      workOrderDate,
      workOrderNo,
      gstNo,
      quoteInfo: quoteInfoIds,
      createdBy: req.user.id,
    });
    quote.contractified = true;
    await quote.save();
    res.status(200).json({ message: "Contract Created!", result: quote });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const singleContract = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id)
      .populate("quoteInfo")
      .populate({ path: "salesPerson", select: "-password" })
      .populate({ path: "createdBy", select: "-password" });
    if (!contract) {
      res.status(400).json({ message: "No such Contract" });
      return;
    }
    res.status(200).json({
      message: "",
      result: contract,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const update = async (req, res, next) => {
  try {
    const contractId = req.params.id;
    const { message, contract: updatedData, modified } = req.body;
    const { quoteInfo, ...otherFields } = updatedData;
    const { _id, ...rest } = otherFields;
    const isapproved = await Contract.isApproved(contractId);
    if (isapproved) {
      const { _id, ...state } = await Contract.findById(contractId)
        .populate("quoteInfo")
        .populate({ path: "salesPerson", select: "-password" })
        .populate({ path: "createdBy", select: "-password" })
        .lean();
      const author = req.user.id;
      await createContractArchiveEntry(
        contractId,
        state,
        author,
        message,
        modified
      );
    }

    // Fetch the existing quotation document
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    // Update the fields directly on the document
    Object.assign(contract, rest);

    // Save the updated quotation
    await contract.save();

    // Update or create quoteInfo documents
    const updatedQuoteInfoIds = [];
    for (const info of quoteInfo) {
      let quoteInfoDoc;
      if (info._id && isValidObjectId(info._id) && info._id.length !== 21) {
        quoteInfoDoc = await QuoteInfo.findByIdAndUpdate(info._id, info, {
          new: true,
          runValidators: true,
        });
      } else if (info?._id.length == 21) {
        const noIdInfo = remove_IdFromObj(info);
        quoteInfoDoc = new QuoteInfo(noIdInfo);
        await quoteInfoDoc.save();
      } else {
        //throw exception
      }
      updatedQuoteInfoIds.push(quoteInfoDoc._id);
    }

    if (!isapproved) {
      const { quoteInfo: oldIdArray } = await Contract.findById(
        contractId
      ).select("quoteInfo");

      // Convert IDs to strings for comparison
      const oldIdArrayStrings = oldIdArray.map((id) => id.toString());
      const updatedQuoteInfoIdsStrings = updatedQuoteInfoIds.map((id) =>
        id.toString()
      );

      const differenceIds = differenceBetweenArrays(
        oldIdArrayStrings,
        updatedQuoteInfoIdsStrings
      );

      if (differenceIds.length > 0) {
        await QuoteInfo.deleteMany({ _id: { $in: differenceIds } });
      }
    }

    // Update the quotation with the new quoteInfo ids
    contract.quoteInfo = updatedQuoteInfoIds;
    await contract.save();
    await contract.reviseContractNo();

    // Fetch the updated quotation with populated quoteInfo & send resposnse
    const finalContract = await Contract.findById(contractId)
      .populate("quoteInfo")
      .populate("createdBy");
    res
      .status(200)
      .json({ message: "Contract Updated", result: finalContract });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
const docData = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Contract.findById(id)
      .populate("quoteInfo")
      .populate("salesPerson")
      .populate("createdBy")
      .lean();
    res.status(200).json({
      message: "Nothing to say for now.",
      result: data,
    });
  } catch (error) {
    next(error);
  }
};
//######Uncomment generateContractNo for automatic No###########
const approve = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Contract.findByIdAndUpdate(id)
      .populate("quoteInfo")
      .populate({ path: "createdBy", select: "-password" })
      .populate({ path: "salesPerson", select: "-password" })
      .lean();
    if (data.approved) {
      res.status(404).json({ message: "Contract Already approved" });
      return;
    }
    const author = req.user.id;
    await createContractArchiveEntry(id, data, author, "Approved");
    const finalData = await Contract.findByIdAndUpdate(id)
      .populate("quoteInfo")
      .populate({ path: "createdBy", select: "-password" })
      .populate({ path: "salesPerson", select: "-password" });
    await finalData.approve();
    await finalData.generateContractNo();
    res.status(200).json({
      message: "Contract Approved.",
      result: finalData,
    });
  } catch (error) {
    next(error);
  }
};
const printCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Contract.findByIdAndUpdate(id)
      .populate("quoteInfo")
      .populate("createdBy");
    await data.incPrintCount();
    res.status(200).json({
      message: "Printed.",
      result: data,
    });
  } catch (error) {
    next(error);
  }
};
const createWorklog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ message: "No such Contract" });
    }

    const {
      workAreaType,
      chemical,
      chemicalUsed,
      remark,
      areaTreated,
      areaTreatedUnit,
    } = req.body;

    let log = await WorkLogs.create({
      workAreaType,
      chemical,
      chemicalUsed,
      remark,
      areaTreated,
      areaTreatedUnit,
      entryBy: req.user.id,
    });

    // Update the contract with the new worklog
    contract.worklogs.push(log._id);
    await contract.save();
    log = await WorkLogs.findById(log._id).populate("entryBy");
    // Respond with the created worklog
    res.status(201).json({ message: "Worklog Created", log });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};
const getWorklogs = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the contract by ID and populate the related fields
    const data = await Contract.findById(id).populate({
      path: "worklogs",
      populate: { path: "entryBy", model: "User" },
    });

    // Check if the contract was found
    if (!data) {
      // Return a 404 Not Found status if the contract does not exist
      return res.status(404).json({
        message: "Contract not found",
        result: null,
      });
    }

    // Return the found data with a 200 OK status
    res.status(200).json({
      message: "",
      result: data,
    });
  } catch (error) {
    // Pass any errors to the error-handling middleware
    next(error);
  }
};
const createDC = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ message: "No such Contract" });
    }
    const { chemical, batchNo, chemicalqty, packaging } = req.body;

    let dc = await DC.create({
      chemical,
      batchNumber: batchNo,
      chemicalqty,
      packaging,
      entryBy: req.user.id,
    });

    // Update the contract with the new worklog
    contract.dcs.push(dc._id);
    await contract.save();

    dc = await DC.findById(dc._id).populate("entryBy");
    // Respond with the created worklog
    res.status(201).json({ message: "Worklog Created", dc });
  } catch (error) {
    next(error); // Pass the error to the error handling middleware
  }
};
const getDCs = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Contract.findById(id).populate({
      path: "dcs",
      populate: { path: "entryBy", model: "User" },
    });
    res.status(200).json({
      message: "",
      result: data,
    });
  } catch (error) {
    next(error);
  }
};
const getChemical = async (req, res, next) => {
  try {
    const allChemicals = await ChemicalBatchNos.find();
    res.status(200).json({ data: allChemicals });
  } catch (error) {
    next(error);
  }
};
const addChemical = async (req, res, next) => {
  const { chemical } = req.body;
  try {
    const newChemical = new ChemicalBatchNos({
      chemical,
    });
    await newChemical.save();
    res
      .status(201)
      .json({ message: "Chemical added successfully", data: newChemical });
  } catch (error) {
    next(error);
  }
};
const addBatchNumber = async (req, res, next) => {
  const { chemicalId } = req.params;
  const { batchNo } = req.body;

  try {
    const updatedChemical = await ChemicalBatchNos.findByIdAndUpdate(
      { _id: chemicalId },
      { $addToSet: { batchNos: batchNo } },
      { new: true }
    );

    if (!updatedChemical) {
      return res.status(404).json({ error: "Chemical not found" });
    }

    res
      .status(200)
      .json({ message: "Batch number added", data: updatedChemical });
  } catch (error) {
    next(error);
  }
};
const deleteBatchNumber = async (req, res, next) => {
  const { chemicalId } = req.params;
  const { batchNo } = req.body;

  try {
    const updatedChemical = await ChemicalBatchNos.findByIdAndUpdate(
      { _id: chemicalId },
      { $pull: { batchNos: batchNo } }, // Removes the specified batch number
      { new: true }
    );

    if (!updatedChemical) {
      return res.status(404).json({ error: "Chemical not found" });
    }

    res
      .status(200)
      .json({ message: "Batch number deleted", data: updatedChemical });
  } catch (error) {
    next(error);
  }
};
const deleteChemical = async (req, res, next) => {
  const { chemicalId } = req.params;
  try {
    const deletedChemical = await ChemicalBatchNos.findByIdAndDelete({
      _id: chemicalId,
    });

    if (!deletedChemical) {
      return res.status(404).json({ message: "Chemical not found" });
    }

    res
      .status(200)
      .json({ message: "Chemical deleted", data: deletedChemical });
  } catch (error) {
    next(error);
  }
};
const deletedContract = async (req, res, next) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findOneAndDelete({ _id: contractId });

    if (!contract) {
      return res.status(404).json({ message: "Contract not found" });
    }

    res.status(200).json({ message: "Contract Deleted!" });
  } catch (error) {
    next(error);
  }
};

const getArchive = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await Contract.findById(id)
      .populate("quoteInfo")
      .populate("salesPerson")
      .populate("createdBy")
      .populate({
        path: "archive",
        populate: { path: "revisions.author", model: "User" },
      })
      .lean();
    res.status(200).json({
      message: "Nothing to say for now.",
      result: data,
    });
  } catch (error) {
    next(error);
  }
};

const genReport = async (req, res, next) => {
  try {
    const data = await Quotation.find({})
      .populate("quoteInfo")
      .populate("salesPerson")
      .populate("createdBy");
    await generateAndSendReport(data);

    // // Set response headers and send the file
    // res.setHeader(
    //   "Content-Disposition",
    //   "attachment; filename=Contract_List.xlsx"
    // );
    // res.setHeader(
    //   "Content-Type",
    //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    // );
    res.send("OK");
  } catch (error) {
    next(error);
  }
};

async function generateExcel(data) {
  try {
    // Create a new workbook and a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Contracts");
    // Add header row
    worksheet.columns = [
      { header: "REP", key: "salesPerson", width: 15 },
      { header: "Date", key: "quotationDate", width: 15 },
      { header: "Contract No", key: "quotationNo", width: 15 },
      { header: "Name of Client", key: "clientName", width: 30 },
      { header: "Area", key: "area", width: 15 },
      { header: "Amount", key: "amount", width: 15 },
      { header: "Contact Nos", key: "contactNos", width: 15 },
      { header: "Remark", key: "remark", width: 30 },
    ];

    // Add a row with the data
    data.forEach((quotation) => {
      const clientName = quotation.billToAddress.name;
      const area =
        quotation.quoteInfo.map((quote) => quote.workArea).join("& ") || "";
      const amount =
        quotation.quoteInfo
          .map((quote) => {
            return `${quote.serviceRate} ${quote.serviceRateUnit}- ${quote.chemical}`;
          })
          .join("& ") || "";
      const contactNosBillTo =
        quotation.billToAddress.kci
          .map((kci) => `${kci.contact} (${kci.name})`)
          .join(", ") || "";
      const contactNosShipTo =
        quotation.shipToAddress.kci
          .map((kci) => `${kci.contact} (${kci.name})`)
          .join(", ") || "";
      const contactNos =
        [contactNosBillTo, contactNosShipTo].filter(Boolean).join("& ") || "";
      worksheet.addRow({
        salesPerson: quotation.salesPerson.initials, // You may want to resolve this reference to a user name
        quotationDate: quotation.quotationDate,
        quotationNo: quotation.quotationNo || quotation._id,
        clientName: clientName,
        area: area,
        amount: amount,
        contactNos: contactNos,
        remark: quotation.note || "", // Add your remark or leave it empty
      });
    });
    // Write to file (or return the buffer as needed)
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  } catch (error) {
    console.error("Error encountered while generating Excel:", error);
    throw error; // Optionally rethrow the error for handling upstream
  }
}

export const sendEmailWithAttachment = async (attachmentUrl) => {
  try {
    let defaultClient = brevo.ApiClient.instance;
    let apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_KEY;

    let apiInstance = new brevo.TransactionalEmailsApi();
    let sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.sender = {
      name: "EPCORN",
      email: process.env.NO_REPLY_EMAIL,
      //email: process.env.EA_EMAIL,
    };
    sendSmtpEmail.to = [
      { email: process.env.STQ_EMAIL },
      //{ email: process.env.EA_EMAIL },
      //{ email: process.env.NO_REPLY_EMAIL },
      { email: process.env.SALES_EMAIL },
      // { email: process.env.COLLEGE_EMAIL },
    ];
    sendSmtpEmail.templateId = 9;
    sendSmtpEmail.attachment = [
      { url: attachmentUrl, name: "Registration of IPM Smark Course.xlsx" },
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);

    return true; // Email sent successfully
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send transactional email");
  }
};

async function generateAndSendReport(data) {
  try {
    const excelBuffer = await generateExcel(data);
    const base64File = excelBuffer.toString("base64");

    // Set up Brevo client
    let defaultClient = brevo.ApiClient.instance;
    let apiKey = defaultClient.authentications["api-key"];
    apiKey.apiKey = process.env.BREVO_KEY;
    let apiInstance = new brevo.TransactionalEmailsApi();

    let sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = {
      name: "EPCORN",
      email: process.env.EA_EMAIL,
    };

    sendSmtpEmail.to = [
      //{ email: process.env.NO_REPLY_EMAIL },
      { email: process.env.OFFICE_EMAIL },
    ];

    sendSmtpEmail.templateId = 9;

    // Attach the file directly using base64
    sendSmtpEmail.attachment = [
      {
        content: base64File,
        name: "Contracts_Report.xlsx",
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    ];

    await apiInstance.sendTransacEmail(sendSmtpEmail);
    return true;
  } catch (error) {
    console.error("Error in generate and send report:", error);
    throw new Error("Failed to generate and send report");
  }
}

export {
  create,
  contracts,
  contractify,
  singleContract,
  update,
  approve,
  printCount,
  docData,
  createDC,
  createWorklog,
  getWorklogs,
  getDCs,
  addBatchNumber,
  addChemical,
  deleteBatchNumber,
  deleteChemical,
  getChemical,
  deletedContract,
  getArchive,
  genReport,
};
