import { useState } from "react";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ImageRun,
} from "docx";
import { saveAs } from "file-saver";
import { useDispatch } from "react-redux";
import { unwrapResult } from "@reduxjs/toolkit";
import { docxData } from "../redux/quote/quoteSlice.js";
import headerImage from "../images/header.png";
import footerImage from "../images/footer.png";
import stamp from "../images/stamp.png";
import { Button } from "flowbite-react";
import {
  saprateQuoteInfo,
  fetchImage,
  isRevised,
} from "../funtions/funtion.js";
import {
  generateStandardDoc,
  generateSupplyApplyDoc,
  generateSupplyDoc,
  createQuoteInfoTableApplySupply,
  createQuoteInfoTableStandard,
  createQuoteInfoTableSupply,
} from "./AnnexureTable.jsx";

// eslint-disable-next-line react/prop-types
const QuotationGenerator = ({ id, color, onClick, text, annexure }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  const generateQuotation = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch data from backend
      const actionResult = await dispatch(docxData(id));
      const result = unwrapResult(actionResult);
      const data = result.result;
      let standard = [];
      let applySupply = [];
      let supply = [];

      if (data.docType) {
        result.result.docType === "standard"
          ? (standard = data.quoteInfo)
          : data.docType === "supply/apply"
          ? (applySupply = data.quoteInfo)
          : data.docType === "supply"
          ? (supply = data.quoteInfo)
          : null;
      } else {
        [standard, applySupply] = saprateQuoteInfo(data.quoteInfo);
      }

      const children = [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: await fetchImage(headerImage),
              transformation: {
                width: 600,
                height: 75,
              },
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "Quotation", bold: true, size: 24 })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Quotation No: ${
                data.quotationNo ? data.quotationNo : data._id
              }`,
              size: 18,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Date: ${new Date(data.quotationDate).toLocaleDateString(
                "en-GB"
              )}`,
              size: 18,
              bold: true,
            }),
          ],
          alignment: AlignmentType.LEFT,
        }),
        new Paragraph({ text: "" }),
        new Paragraph({ text: "" }),
        createAddressTable(data.billToAddress, data.shipToAddress),
        new Paragraph({ text: "" }),
        ...(data.kindAttention.trim() !== "" && data.kindAttention !== "NA"
          ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `Kind Attention: ${data.kindAttentionPrefix} ${data.kindAttention}`,
                    bold: true,
                  }),
                ],
              }),
            ]
          : []),
        new Paragraph({ text: "" }),
        ...(!isRevised(data.quotationNo)
          ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${
                      data.salesPerson.initials === "SALES"
                        ? "We thank you for your enquiry and the opportunity given to us to quote our rates, Further to your instructions, we are pleased to submit our quotation as below"
                        : `We thank for your enquiry & the time given to our Representative ${data.salesPerson.prefix} ${data.salesPerson.username}`
                    }`,
                    bold: true,
                  }),
                ],
              }),
            ]
          : []),
        ...(isRevised(data.quotationNo)
          ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: "As per your requirement, submiting our revised offer as below.",
                    bold: true,
                  }),
                ],
              }),
            ]
          : []),
        new Paragraph({ text: "" }),
        createInfoTable(data, standard.length, applySupply.length),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [new TextRun({ text: "Quote Information:", bold: true })],
        }),
      ];

      if (standard.length > 0) {
        children.push(createQuoteInfoTableStandard(standard));
      }
      if (applySupply.length > 0) {
        children.push(new Paragraph({ text: "" }));
        children.push(createQuoteInfoTableApplySupply(applySupply));
      }

      if (supply.length > 0) {
        children.push(new Paragraph({ text: "" }));
        children.push(createQuoteInfoTableSupply(supply));
      }
      // children.push(
      //   new Paragraph({
      //     children: [
      //       new TextRun({
      //         text: "* Certified Member of IGBC (Indian Green Building Council).",
      //         break: 1,
      //         bold: true,
      //       }),
      //       new TextRun({
      //         text: "* Authorised Applicator for Imidachloprid 30.5% SC 'PREMISE' Chemical.",
      //         break: 1,
      //         bold: true,
      //       }),
      //       new TextRun({
      //         text: "* Active Member of IPCA and ENVU PEST Alliance.",
      //         break: 1,
      //         bold: true,
      //       }),
      //     ],
      //   })
      // );
      children.push(
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text:
                data?.docType === "supply"
                  ? "The offer provided is for product supply as per your requirements provided and we hope you will accept the same and will give us the opportunity to supply."
                  : `We hope you will accept the same and will give us the opportunity to be of service to you.`,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Please call us for clarification if any.`,
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Thanking you,`,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Yours faithfully,`,
            }),
          ],
        }),
        new Paragraph({ text: "" }),
        new Paragraph({
          children: [
            new TextRun({
              text: `For EXPRESS PESTICIDES PVT. LTD.`,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new ImageRun({
              data: await fetchImage(stamp),
              transformation: {
                width: 50,
                height: 40,
              },
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Authorized Signatory`,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `${data.salesPerson.initials}/${data.createdBy.initials}`,
            }),
          ],
        })
      );

      //the footer image at the end
      children.push(
        new Paragraph({ text: "" }), // Add some space before the footer image
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new ImageRun({
              data: await fetchImage(footerImage),
              transformation: {
                width: 600,
                height: 65,
              },
            }),
          ],
        })
      );
      const { header, title, table } =
        data.docType === "standard"
          ? await generateStandardDoc(data.quoteInfo)
          : data.docType === "supply"
          ? await generateSupplyDoc(data.quoteInfo)
          : data.docType === "supply/apply"
          ? await generateSupplyApplyDoc(data.quoteInfo)
          : null;
      const doc = new Document({
        styles: {
          default: {
            document: {
              run: {
                font: "Arial",
              },
            },
          },
        },
        sections: [
          {
            properties: {
              page: {
                margin: {
                  top: 500, // 0.5 cm in twips
                  bottom: 500, // 0.5 cm in twips
                  left: 800, // 1.27 cm in twips
                  right: 800, // 1.27 cm in twips
                },
              },
            },
            children: children,
          },
          // Conditionally include the second page if annexure is true
          ...(annexure
            ? [
                {
                  properties: {
                    page: {
                      margin: {
                        top: 500, // 0.5 cm in twips
                        bottom: 500, // 0.5 cm in twips
                        left: 800, // 1.27 cm in twips
                        right: 800, // 1.27 cm in twips
                      },
                    },
                  },
                  children: [header, title, table],
                },
              ]
            : []),
        ],
      });

      // Generate and save file
      const blob = await Packer.toBlob(doc);
      saveAs(
        blob,
        `${data.billToAddress.name}-${data.shipToAddress.projectName}-${
          data.shipToAddress.a4
        }-${data.shipToAddress.city}-${
          data.quotationNo ? data.quotationNo : data._id
        }.docx`
      );
    } catch (err) {
      console.log(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const boldWithinText = (boldText, normalText) => {
    const parts = normalText.split(boldText);
    const elements = parts.reduce((acc, part, index) => {
      acc.push(new TextRun(part));
      if (index < parts.length - 1) {
        acc.push(new TextRun({ text: boldText, bold: true }));
      }
      return acc;
    }, []);
    return [new Paragraph({ children: elements })];
  };
  const createAddressTable = (billTo, shipTo) => {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({ text: "Bill To:", bold: true }),
                new Paragraph({
                  children: [
                    new TextRun({
                      text: billTo.prefix + " " + billTo.name + ".",
                      bold: true,
                    }),
                  ],
                }),
                new Paragraph({ text: billTo.a1 + " " + billTo.a2 + "," }),
                new Paragraph({ text: billTo.a3 + "," }),
                new Paragraph({ text: billTo.a4 + "," }),
                new Paragraph({
                  text: `${billTo.city} - ${billTo.pincode},`,
                }),
                new Paragraph({ text: billTo.a5 + "." }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  text: "Ship To:",
                  bold: true,
                }),
                new Paragraph({
                  children: [
                    new TextRun({ text: shipTo.projectName + ".", bold: true }),
                  ],
                }),
                new Paragraph({ text: shipTo.a1 + " " + shipTo.a2 + "," }),
                new Paragraph({ text: shipTo.a3 + "," }),
                new Paragraph({ text: shipTo.a4 + "," }),
                new Paragraph({
                  text: `${shipTo.city} - ${shipTo.pincode},`,
                }),
                new Paragraph({ text: shipTo.a5 + "." }),
              ],
              width: { size: 50, type: WidthType.PERCENTAGE },
            }),
          ],
        }),
      ],
    });
  };

  const createInfoRow = (label, value) => {
    // Create a TextRun for the label with bold formatting
    const labelText = new TextRun({
      text: label,
      bold: true,
    });

    let valueContent;

    if (Array.isArray(value)) {
      if (value.length === 1) {
        // If there's only one element, treat it as a normal string
        valueContent = [
          new Paragraph({
            children: [
              new TextRun({
                text: value[0],
              }),
            ],
          }),
        ];
      } else {
        // If there's more than one element, create numbered paragraphs
        valueContent = value.map(
          (item, index) =>
            new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. ${item}`,
                }),
              ],
            })
        );
      }
    } else {
      // If value is not an array, create a single paragraph
      valueContent = [
        new Paragraph({
          children: [
            new TextRun({
              text: value,
            }),
          ],
        }),
      ];
    }

    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [labelText] })],
          width: { size: 25, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: valueContent,
          width: { size: 90, type: WidthType.PERCENTAGE },
        }),
      ],
    });
  };
  const createInfoTable = (data, sL, aL) => {
    const paymentTermsArray = data.paymentTerms
      .split(".")
      .filter((v) => v.trim() !== "");

    const commonFields = [
      { label: "Subject:", value: data.subject + " " + data.shipToAddress.a4 },
      { label: "Reference:", value: data.reference },
      {
        label: "Treatment Type:",
        value: data.treatmentType + "  [Sac-code ... 998531]",
      },
      { label: "Specification:", value: data.specification },
      { label: "Payment Terms:", value: paymentTermsArray },
      { label: "Taxation:", value: data.taxation },
    ];

    const supplyFields = [...commonFields];

    const normalFields = [
      ...commonFields,
      { label: "Equipments:", value: data.equipments },
      {
        label: "Service Warranty:",
        value:
          "10 Years In case of subterranean or ground dwelling of termite infestation during the guarantee period, we undertake to treat the same and eradicate the termite infestation without any extra cost to you. This guarantee will be forwarded on stamp paper.",
      },
    ];

    let fields = data.docType === "supply" ? supplyFields : normalFields;

    // Conditionally add the Note field if it's not empty
    if (data.note && data.note.trim() !== "") {
      fields.push({ label: "Note:", value: data.note });
    }

    const rows = fields.flatMap((field) => [
      createInfoRow(field.label, field.value),
      ...(sL <= 2 && aL <= 5 ? [createEmptyRow()] : []),
    ]);

    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE },
        bottom: { style: BorderStyle.NONE },
        left: { style: BorderStyle.NONE },
        right: { style: BorderStyle.NONE },
        insideHorizontal: { style: BorderStyle.NONE },
        insideVertical: { style: BorderStyle.NONE },
      },
      rows: rows,
    });
  };
  const createEmptyRow = () => {
    return new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({})],
        }),
        new TableCell({
          children: [new Paragraph({})],
        }),
      ],
    });
  };

  return (
    <div>
      <Button
        color={color}
        onClick={() => [generateQuotation(), onClick()]}
        disabled={isLoading}
      >
        {isLoading ? "Generating..." : `${text}`}
      </Button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default QuotationGenerator;
