import mongoose from 'mongoose';



const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },  // sequence name, e.g. "supportTicket"
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function (name) {
  const doc = await this.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
};

export default mongoose.models.Counter || mongoose.model('Counter', counterSchema);