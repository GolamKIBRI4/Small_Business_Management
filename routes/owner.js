const mongoose=require('mongoose');
const plm=require('passport-local-mongoose');

mongoose.connect('mongodb+srv://golamkibria:1234@cluster0.lzxkxdz.mongodb.net/authcheck?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));


const ownerSchema = new mongoose.Schema({
  username: { type: String },
  companyname: { type: String },
  ownername: { type: String },
  password: { type: String },
  secret: { type: Number },
  phone: { type: Number },
  email: { type: String },
  photo: { type: String }
});

ownerSchema.plugin(plm);

module.exports = mongoose.model('Owner', ownerSchema);