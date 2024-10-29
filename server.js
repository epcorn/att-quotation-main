import express from "express";
import cors from "cors";
import path from "path";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import connectDB from "./config/mongoose.js";
import errorMiddleware from "./middleware/errorMiddleware.js";
import rootRouter from "./routes/index.js";
import { Quotation } from "./models/index.js";
connectDB();

const app = express();

//Root Middleware
app.use(
  morgan(function (tokens, req, res) {
    return [
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, "content-length"),
      "-",
      tokens["response-time"](req, res),
      "ms",
    ].join(" ");
  })
);
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1", rootRouter);

(function fn() {
  if (process.env.NODE_ENV === "production") {
    const __dirname = path.resolve();
    app.use(express.static(path.join(__dirname, "/client/dist")));
    app.get("*", (req, res) =>
      res.sendFile(path.resolve(__dirname, "client", "dist", "index.html"))
    );
  } else {
    app.get("/", (req, res) => {
      res.send("API is running....");
    });
  }
})();

app.use(errorMiddleware);
async () => {
  try {
    const quotations = await Quotation.find({
      quotationNo: { $ne: "" }, // QuotationNo is not an empty string
      approved: false,
    }).select({ quotationNo: 1, docType: 1, _id: 0 }); // Select only quotationNo and doctype fields

    quotations.forEach(({ quotationNo }) => {
      console.log(`${quotationNo}: [ ] standard [ ] supply [ ] supply/apply`);
      console.log("");
    });
  } catch (error) {
    console.error("Error fetching quotations:", error);
  }
};

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server running at port: ${port}`));
