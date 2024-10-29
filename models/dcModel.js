import mongoose from "mongoose";

const dcSchema = new mongoose.Schema(
  {
    chemical: {
      type: String,
      required: true,
    },
    batchNumber: {
      type: String,
      required: true,
    },
    chemicalqty: {
      type: String,
      required: true,
    },
    packaging: {
      type: String,
      required: true,
    },
    entryBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const DC = mongoose.model("DC", dcSchema);

export default DC;
