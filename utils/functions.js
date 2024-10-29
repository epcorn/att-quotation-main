import { QuoteArchive } from "../models/index.js";

function differenceBetweenArrays(A, B) {
  return A.filter((element) => !B.includes(element));
}

const removeIdFromDocuments = (documents) => {
  return documents.map(({ id, ...rest }) => rest);
};
const remove_IdFromObj = (obj) => {
  const { _id, ...rest } = obj;
  return rest;
};

async function createQuoteArchiveEntry(
  quoteId,
  state,
  author,
  message,
  changes
) {
  const theArchive = await QuoteArchive.findOne({ quotationId: quoteId });
  if (theArchive) {
    theArchive.revisions.push({ state, author, message, changes });
    await theArchive.save();
  } else {
    const newArchive = new QuoteArchive({
      quotationId: quoteId,
      revisions: [{ state, author, message, changes }],
    });
    await newArchive.save();
  }
}

async function createContractArchiveEntry(
  contractId,
  state,
  author,
  message,
  changes
) {
  const theArchive = await QuoteArchive.findOne({ contractId });
  if (theArchive) {
    theArchive.revisions.push({ state, author, message, changes });
    await theArchive.save();
  } else {
    const newArchive = new QuoteArchive({
      contractId,
      revisions: [{ state, author, message, changes }],
    });
    await newArchive.save();
  }
}

function isRevised(string) {
  const parts = String(string).split("/");

  const lastPart = parts[parts.length - 1];

  const regex = /R([1-9][0-9]*)/;

  return regex.test(lastPart);
}

export {
  differenceBetweenArrays,
  removeIdFromDocuments,
  remove_IdFromObj,
  createQuoteArchiveEntry,
  isRevised,
  createContractArchiveEntry,
};
