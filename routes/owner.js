const mongoose=require('mongoose');
const plm=require('passport-local-mongoose');

mongoose.connect('mongodb+srv://golamkibria:1234@cluster0.lzxkxdz.mongodb.net/authcheck?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB connection error:", err));


const ownerSchema = new mongoose.Schema({
  companyName: String, 
  username: String,
  password: String,
  secret: String,
  phone: Number,
  route: String,
  photo: String // Will store file name (or URL) of uploaded image
});

ownerSchema.plugin(plm);

module.exports = mongoose.model('Owner', ownerSchema);