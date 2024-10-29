import { Button, Table } from "flowbite-react";
import { useCallback, useEffect, useState } from "react";
import TimeAgo from "react-timeago";
import {
  CustomModal,
  HistoryPanelQuote,
  Loading,
  NewQuote,
  PopUp2,
  Refresh,
  ViewQuote,
} from "../components";
import { useDispatch, useSelector } from "react-redux";
import { getInitials } from "../redux/user/userSlice";
import {
  getQuotes,
  approve,
  showMoreQuotes,
  makeContract,
} from "../redux/quote/quoteSlice";
import { SearchQuote, UpdateQuotation } from "../components/index.js";
import { unwrapResult } from "@reduxjs/toolkit";
import { toast } from "react-toastify";
import PopUp from "../components/PopUp";
import { getDotColor } from "../funtions/funtion";
import { useNavigate } from "react-router-dom";
import debounce from "lodash.debounce";

export default function Create() {
  const {
    quotations = [],
    loading,
    showMore,
  } = useSelector((state) => state.quote);
  const { currentUser } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const [createModel, setCreateModel] = useState(false);
  const [viewModel, setViewModel] = useState(false);
  const [updateModel, setUpdateModel] = useState(false);
  const [archiveModel, setArchiveModel] = useState(false);
  const [quoteId, setQuoteId] = useState("");
  const [quoteNo, setQuoteNo] = useState("");
  const [extraQuery, setExtraQuery] = useState(null);
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (quotations.length <= 0) {
      dispatch(getInitials());
      dispatch(getQuotes());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (
      currentUser.rights.createQuote ||
      currentUser.rights.admin ||
      currentUser.rights.createContract
    ) {
      return;
    } else {
      navigate("/");
    }
  }, [
    currentUser.rights.admin,
    currentUser.rights.createQuote,
    currentUser.rights.createContract,
    dispatch,
    navigate,
  ]);

  async function handleClick(id) {
    if (!currentUser.rights.admin && !currentUser.rights.approve) {
      toast.error("Contact VNT to approve the Quotation.");
      return;
    }
    const actionResult = await dispatch(approve(id));
    // eslint-disable-next-line no-unused-vars
    const result = unwrapResult(actionResult);
  }
  // Check if the user has scrolled to the bottom of the page
  const handleShowMore = useCallback(
    debounce(async () => {
      const startIndex = quotations.length;
      if (!showMore) {
        return;
      }
      if (showMore && extraQuery) {
        dispatch(showMoreQuotes({ startIndex, extraQuery }));
      } else {
        dispatch(showMoreQuotes({ startIndex, extraQuery }));
        setExtraQuery(null);
      }
    }, 400), // Debounce delay in milliseconds
    [quotations.length, showMore, extraQuery, dispatch] // Dependencies for useCallback
  );
  const handleScroll = useCallback(() => {
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    if (scrollTop + windowHeight >= documentHeight - 5) {
      handleShowMore(); // Call the debounced function
    }
  }, [handleShowMore]);
  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    // Clean up the event listener on unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  async function handleContractify(id) {
    try {
      if (!currentUser.rights.createContract && !currentUser.rights.admin) {
        toast.error("Not allowed!");
        return;
      }
      dispatch(makeContract(id));
    } catch (error) {
      console.log(error);
    }
  }
  async function handleRefresh() {
    setPending(true);
    await dispatch(getQuotes());
    setPending(false);
  }
  return (
    <div className=" max-w-[1400px] mx-auto ">
      {loading ? <Loading /> : null}
      <div className="h-full mt-3">
        <div className=" mt-2 h-full">
          <div className="h-16 text-lg flex items-center justify-between font-medium bg-[#6FDCE3] border border-black rounded-tl-lg rounded-br-lg">
            <div className="m-2">
              <Refresh loading={pending} onRefresh={handleRefresh} />
            </div>
            <div className="flex-grow mr-4 flex items-center justify-evenly ">
              <div className="flex items-center justify-center">
                <h3>Recent Quotations</h3>
              </div>
            </div>
            <div>
              <button
                className="bg-[#FFFDB5] hover:bg-yellow-200 font-medium py-2 px-4 rounded-tl-lg rounded-br-lg mr-2"
                onClick={() => setCreateModel(true)}
                disabled={
                  currentUser.rights.createQuote || currentUser.rights.admin
                    ? false
                    : true
                }
              >
                Create Quotation
              </button>
            </div>
          </div>
          <div>
            <SearchQuote setExtraQuery={setExtraQuery} />
          </div>
          <div className=" overflow-x-auto ">
            <Table>
              <Table.Head>
                <Table.HeadCell>Quotation No</Table.HeadCell>
                <Table.HeadCell>Quotation Date</Table.HeadCell>
                <Table.HeadCell>Created By</Table.HeadCell>
                <Table.HeadCell>Project Name</Table.HeadCell>
                <Table.HeadCell>Client Name</Table.HeadCell>
                <Table.HeadCell>Timestamp</Table.HeadCell>
                <Table.HeadCell>Edit</Table.HeadCell>
                <Table.HeadCell>Action</Table.HeadCell>
              </Table.Head>
              <Table.Body>
                {quotations.length > 0 &&
                  quotations.map((ticket) => (
                    <Table.Row
                      key={ticket._id}
                      className={`transition-all duration-700 ease-in-out ${
                        quoteId === ticket._id
                          ? "bg-blue-100  border-green-500 text-green-700"
                          : "bg-white border-blue-300 text-gray-700"
                      } border-b-2`}
                    >
                      <Table.Cell>
                        <div className="flex items-center justify-start w-full gap-1 text-nowrap">
                          <PopUp
                            click={handleClick}
                            id={ticket._id}
                            approved={ticket.approved}
                          />
                          {ticket.quotationNo ? ticket.quotationNo : ticket._id}
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        {new Date(ticket.quotationDate).toLocaleDateString(
                          "en-GB"
                        )}
                      </Table.Cell>
                      <Table.Cell>{ticket.createdBy?.username}</Table.Cell>
                      <Table.Cell>
                        {ticket.shipToAddress.projectName}
                      </Table.Cell>
                      <Table.Cell>{ticket.billToAddress.name}</Table.Cell>
                      <Table.Cell>
                        <TimeAgo date={new Date(ticket.updatedAt)} />
                      </Table.Cell>
                      <Table.Cell>
                        {ticket.contractified ? (
                          <Button gradientDuoTone="redToYellow" disabled>
                            Contract
                          </Button>
                        ) : (
                          <Button
                            outline
                            gradientDuoTone="redToYellow"
                            disabled={
                              currentUser.rights.createQuote ||
                              currentUser.rights.admin
                                ? false
                                : true
                            }
                            onClick={() => [
                              setQuoteId(ticket._id),
                              setQuoteNo(ticket.quotationNo),
                              setUpdateModel(true),
                            ]}
                          >
                            {ticket.approved ? (
                              <span>Revise</span>
                            ) : (
                              <span>Edit</span>
                            )}
                          </Button>
                        )}
                      </Table.Cell>
                      <Table.Cell className="border ">
                        <div className="flex items-center justify-evenly flex-wrap gap-1 relative">
                          <div
                            className={`absolute top-0 left-0 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${getDotColor(
                              ticket.docType
                            )}`}
                          ></div>
                          <Button
                            gradientDuoTone="purpleToBlue"
                            onClick={() => [
                              setViewModel(true),
                              setQuoteId(ticket._id),
                              setQuoteNo(ticket.quotationNo),
                            ]}
                          >
                            View
                          </Button>
                          {ticket.approved && ticket.emailTo ? (
                            <Button gradientDuoTone="greenToBlue">Email</Button>
                          ) : null}

                          {ticket.approved &&
                          !ticket.contractified &&
                          (currentUser.rights.createContract ||
                            currentUser.rights.admin) ? (
                            <Button
                              gradientMonochrome="purple"
                              onClick={() => [
                                handleContractify(ticket._id),
                                setQuoteId(ticket._id),
                              ]}
                              disabled={
                                currentUser.rights.createContract ||
                                currentUser.rights.admin
                                  ? false
                                  : true
                              }
                            >
                              Initiate Contract
                            </Button>
                          ) : null}

                          {ticket.approved ? (
                            <Button
                              onClick={() => [
                                setArchiveModel(true),
                                setQuoteId(ticket._id),
                                setQuoteNo(ticket.quotationNo),
                              ]}
                              gradientDuoTone="tealToLime"
                            >
                              History
                            </Button>
                          ) : null}
                          <PopUp2
                            setQuoteId={setQuoteId}
                            id={ticket._id}
                            disabled={ticket.contractified}
                          />
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))}
              </Table.Body>
            </Table>
            {quotations.length <= 0 && (
              <h1 className="text-center">
                No Quotation
                <span style={{ fontSize: "60px" }}>&#128524;</span>
              </h1>
            )}
          </div>
        </div>
      </div>
      <CustomModal
        isOpen={createModel}
        onClose={() => [setCreateModel(!createModel), setQuoteId(null)]}
        size="7xl"
        heading="New Quotation"
        bg="bg-teal-50"
      >
        <NewQuote onClose={() => [setCreateModel(!createModel)]} />
      </CustomModal>
      <CustomModal
        isOpen={viewModel}
        onClose={() => [setViewModel(!viewModel)]}
        size="7xl"
        heading={
          <div className="flex items-center justify-center">
            <span>View/Edit</span>
            {quoteNo ? (
              <span className="ml-5">{quoteNo}</span>
            ) : (
              <span className="ml-5">{quoteId}</span>
            )}
          </div>
        }
      >
        <ViewQuote quoteId={quoteId} />
      </CustomModal>
      <CustomModal
        isOpen={updateModel}
        onClose={() => [setUpdateModel(!updateModel)]}
        size="7xl"
        heading={
          <div className="flex items-center justify-center">
            <span>View/Edit</span>
            {quoteNo ? (
              <span className="ml-5">{quoteNo}</span>
            ) : (
              <span className="ml-5">{quoteId}</span>
            )}
          </div>
        }
      >
        <UpdateQuotation
          quoteId={quoteId}
          onClose={() => [setUpdateModel(!updateModel)]}
        />
      </CustomModal>
      <CustomModal
        isOpen={archiveModel}
        onClose={() => [setArchiveModel(!archiveModel)]}
        size="7xl"
        heading={
          <div className="flex items-center justify-center">
            <span>View/Edit</span>
            {quoteNo ? (
              <span className="ml-5">{quoteNo}</span>
            ) : (
              <span className="ml-5">{quoteId}</span>
            )}
          </div>
        }
      >
        <HistoryPanelQuote
          quoteId={quoteId}
          onClose={() => [setArchiveModel(!archiveModel)]}
        />
      </CustomModal>
    </div>
  );
}
