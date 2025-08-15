const PORT=process.env.PORT || 4000;
const express=require("express");
const app=express();
require("dotenv").config();
const Razorpay=require("razorpay");
const mongoose=require("mongoose");
const jwt=require("jsonwebtoken");
const multer=require("multer");
const path=require("path");
const cors=require("cors");
const { type } = require("os");
const MONGO_URL=process.env.MONGO_URL;

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://ecommerce-mern-orpin.vercel.app',  // frontend
    'https://ecommerce-mern-ez49.vercel.app'    // admin panel
  ],
  credentials: true
}));

app.use(express.json());

//Database connection with MongoDB
mongoose.connect(MONGO_URL)

//API creation
app.get("/",(req,res)=>{
    res.send("Express App is running")
})

const storage = multer.diskStorage({
  destination: './upload/images',
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

app.use('/images', express.static(path.join(__dirname, 'upload/images')));

app.post('/upload', upload.single('product'), (req, res) => {
  const fullUrl = `https://ecommerce-mern-hlm8.onrender.com/images/${req.file.filename}`;
  res.json({
    success: 1,
    image_url: fullUrl
  });
});


//Schema for Creating products
const Product =mongoose.model("Product",{
    id:{
        type:Number,
        required:true,
    },
    name:{
        type:String,
        required:true,
    },
    image:{
        type:String,
        required:true,
    },
    category:{
        type:String,
        required:true,
    },
    new_price:{
        type:Number,
        required:true,
    },
    old_price:{
        type:Number,
        required:true,
    },
    date:{
        type:Date,
        default:Date.now,
    },
    available:{
        type:Boolean,
        default:true,
    }
})

app.post('/addproduct',async(req,res)=>{
    let products=await Product.find({});
    let id;
    if(products.length>0){
        let last_product_array=products.slice(-1);
        let last_product=last_product_array[0];
        id=last_product.id+1;
    }
    else{
        id=1;
    }
    const product=new Product({
        id:id,
        name:req.body.name,
        image:req.body.image,
        category:req.body.category,
        new_price:req.body.new_price,
        old_price:req.body.old_price,
    });
    console.log(product);
    await product.save();
    console.log("Saved");
    res.json({
        success:true,
        name:req.body.name,
    })
})

//Creating API for deleting products
app.post('/removeproduct',async(req,res)=>{
    await Product.findOneAndDelete({id:req.body.id});
    console.log("Removed");
    res.json({
        success:true,
        name:req.body.name
    })
})

//Creating API for getting all products
app.get('/allproducts',async(req,res)=>{
    let products=await Product.find({});
    console.log("All Products Fetched");
    res.send(products);
})

//Schema creation for User model
const Users=mongoose.model('Users',{
    name:{
        type:String,
    },
    email:{
        type:String,
        unique:true,
    },
    password:{
        type:String,
    },
    cartData:{
        type:Object,
    },
    date:{
        type:Date,
        default:Date.now,
    }
})

//Creating Endpoint for registering the user
app.post('/signup',async(req,res)=>{
    let check=await Users.findOne({email:req.body.email});
    if(check){
        return res.status(400).json({success:false,errors:"existing user found with same email address"})
    }
    let cart={};
    for (let i = 0 ; i< 300 ; i++) {
        cart[i]=0;    
    }
    const user=new Users({
        name:req.body.username,
        email:req.body.email,
        password:req.body.password,
        cartData:cart,
    })
    await user.save();
    const data={
        user:{
            id:user.id
        }
    }
    const token=jwt.sign(data,'secret_ecom');
    res.json({success:true,token})
})

//Creating endpoint for user login
app.post('/login',async(req,res)=>{
    let user=await Users.findOne({email:req.body.email});
    if(user){
        const passCompare=req.body.password===user.password;
        if(passCompare){
            const data={
                user:{
                    id:user.id
                }
            }
            const token=jwt.sign(data,'secret_ecom');
            res.json({success:true,token});
        }
        else{
            res.json({success:false,errors:"Wrong Password"});
        }
    }
    else{
        res.json({success:false,errors:"Wrong Email Id"})
    }
})

//Creating endpoint for newcollection data
app.get('/newcollections',async(req,res)=>{
    let products=await Product.find({});
    let newcollection=products.slice(1).slice(-8);
    console.log('NewCollection Fetched');
    res.send(newcollection);
})

//Creating endpoint for popular in women section
app.get('/popularinwomen',async(req,res)=>{
    let products=await Product.find({category:'women'});
    let popular_in_women=products.slice(0,4);
    console.log('Popular in women fetched');
    res.send(popular_in_women);
})

//creating middleware to fetch user
const fetchUser=async(req,res,next)=>{
    const token=req.header('auth-token');
    if(!token){
        res.status(401).send({errors:'Please authenticate using valid token'})
    }
    else{
        try{
            const data=jwt.verify(token,'secret_ecom');
            req.user=data.user;
            next();
        }catch(error){
            res.status(401).send({errors:'please authenticate using a valid token'})
        }
    }
}

//creating endpoint for adding products in cartdata
app.post('/addtocart',fetchUser,async(req,res)=>{
    let userData=await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId]+=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send('Added');
    console.log('Added',req.body.itemId);
})

//creating endpoint to remove product from cartdata
app.post('/removefromcart',fetchUser,async(req,res)=>{
    console.log('removed',req.body.itemId);
    let userData=await Users.findOne({_id:req.user.id});
    userData.cartData[req.body.itemId]-=1;
    await Users.findOneAndUpdate({_id:req.user.id},{cartData:userData.cartData});
    res.send('Added')
})

//creating endpoint to get cartdata
app.post('/getcart',fetchUser,async(req,res)=>{
    console.log('Getcart');
    let userData=await Users.findOne({_id:req.user.id});
    res.json(userData.cartData);
})

//creating endpoint for razorpay payment gateway
const razorpay=new Razorpay({
    key_id:process.env.RAZORPAY_KEY_ID,
    key_secret:process.env.RAZORPAY_SECRET_KEY,
})
app.post('/create-order',async(req,res)=>{
    try{
        const {amount}=req.body;
        const options={
            amount:amount*100,
            currency:"INR",
            receipt:`receipt_order_${Math.floor(Math.random()*1000000)}`,
        };
        const order=await razorpay.orders.create(options);
        res.status(200).json({success:true,order});
    }catch(err){
        console.error(err);
        res.status(500).json({success:false,error:"Something went wrong"});
    }
})

app.listen(PORT,(error)=>{
    if(!error){
        console.log("Server Running on port "+PORT+MONGO_URL)
    }
    else{
        console.log("Error : "+error)
    }
})