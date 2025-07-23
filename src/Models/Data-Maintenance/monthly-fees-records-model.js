import mongoose from "mongoose";

const MonthlyFeesSchema = new mongoose.Schema({
  studentId: { type:String, required: true },
  amount: { type: Number, required: true },
  paymentDate: {type: Date,default: Date.now},
  paymentMethod: {type: String,required: true},
  status: { type: String, enum: ['paid', 'pending', 'cancelled'], default: 'pending',required: true },
  date: { type: Date, default: Date.now, required: true }
},{timestamp:true});
const MonthlyFeesRecords =mongoose.model("Monthly-Fees-Records", MonthlyFeesSchema);

export default MonthlyFeesRecords;