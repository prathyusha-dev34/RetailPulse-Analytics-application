import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Container,
  MenuItem,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import {
  useNavigate,
} from "react-router-dom";

import {
  createSale,
} from "../api/salesApi";

import {
  getProducts,
} from "../api/productApi";


export default function AddSale(){

  const navigate = useNavigate();


  const [products,setProducts] =
    useState<any[]>([]);


  const [customerName,setCustomerName] =
    useState("");


  const [saleDate,setSaleDate] =
    useState(
      new Date()
      .toISOString()
      .slice(0,16)
    );


  const [productId,setProductId] =
    useState("");


  const [productName,setProductName] =
    useState("");


  const [category,setCategory] =
    useState("");


  const [sku,setSku] =
    useState("");


  const [availableStock,setAvailableStock] =
    useState(0);


  const [quantity,setQuantity] =
    useState(1);


  const [unitPrice,setUnitPrice] =
    useState(0);


  const [discount,setDiscount] =
    useState(0);


  const [tax,setTax] =
    useState(0);


  const [salesChannel,setSalesChannel] =
    useState("Retail Store");


  const [paymentMethod,setPaymentMethod] =
    useState("Cash");


  const [loading,setLoading] =
    useState(false);


  const [snackbar,setSnackbar] =
    useState({

      open:false,

      message:"",

      type:"success" as
      "success" | "error"

    });



  const textFieldStyle = {

    width:"100%",


    "& .MuiInputLabel-root":{
      color:"#cbd5e1"
    },


    "& .MuiOutlinedInput-root":{

      color:"#fff",

      background:"#1e293b",


      "& fieldset":{
        borderColor:"#475569"
      },


      "&:hover fieldset":{
        borderColor:"#60a5fa"
      },


      "&.Mui-focused fieldset":{
        borderColor:"#3b82f6"
      }

    }

  };



  useEffect(()=>{


    const loadProducts = async()=>{


      try{


        const response:any =
          await getProducts();



        const productList =

          response.data.products ??

          response.data.data ??

          response.data.items ??

          response.data;



        setProducts(
          productList || []
        );


      }
      catch(error){


        console.error(
          "Product loading error",
          error
        );


      }


    };


    loadProducts();


  },[]);




  const handleProductChange = (
    id:string
  )=>{


    setProductId(id);



    const product =

      products.find(
        (item:any)=>
          item.id === Number(id)
      );



    if(product){


      setProductName(
        product.name || "-"
      );



      setCategory(

        product.category?.name ||

        product.category_name ||

        String(
          product.category_id || "-"
        )

      );



      setSku(
        product.sku || "-"
      );



      setUnitPrice(
        Number(
          product.unit_price || 0
        )
      );



      setAvailableStock(

        Number(

          product.stock_quantity ??

          product.stock ??

          product.available_stock ??

          0

        )

      );


    }


  };

    const subtotal = useMemo(()=>{

    return (

      Number(quantity) *

      Number(unitPrice)

    );

  },[
    quantity,
    unitPrice
  ]);



  const discountAmount = useMemo(()=>{

    return (

      subtotal *

      Number(discount)

    ) / 100;

  },[
    subtotal,
    discount
  ]);



  const taxAmount = useMemo(()=>{

    return (

      (

        subtotal -

        discountAmount

      )

      *

      Number(tax)

    ) / 100;

  },[
    subtotal,
    discountAmount,
    tax
  ]);



  const totalAmount = useMemo(()=>{

    return (

      subtotal -

      discountAmount +

      taxAmount

    );

  },[
    subtotal,
    discountAmount,
    taxAmount
  ]);



  const handleSubmit = async()=>{


    if(!customerName.trim()){

      setSnackbar({

        open:true,

        message:"Customer name required",

        type:"error"

      });

      return;

    }



    if(!productId){

      setSnackbar({

        open:true,

        message:"Please select product",

        type:"error"

      });

      return;

    }



    if(quantity <= 0){

      setSnackbar({

        open:true,

        message:"Quantity must be greater than zero",

        type:"error"

      });

      return;

    }



    if(unitPrice < 0){

      setSnackbar({

        open:true,

        message:"Unit price cannot be negative",

        type:"error"

      });

      return;

    }



    if(discountAmount > subtotal){

      setSnackbar({

        open:true,

        message:"Discount cannot exceed product value",

        type:"error"

      });

      return;

    }



    if(tax < 0){

      setSnackbar({

        open:true,

        message:"Tax cannot be negative",

        type:"error"

      });

      return;

    }



    if(quantity > availableStock){

      setSnackbar({

        open:true,

        message:"Insufficient stock",

        type:"error"

      });

      return;

    }



    try{

      setLoading(true);



      await createSale({

        customer_name:customerName,

        sale_date:saleDate,

        sales_channel:salesChannel,

        payment_method:paymentMethod,

        items:[

          {

            product_id:Number(productId),

            quantity:Number(quantity),

            unit_price:Number(unitPrice),

            discount:Number(discount),

            tax:Number(tax)

          }

        ]

      });



      setSnackbar({

        open:true,

        message:"Sale created successfully",

        type:"success"

      });



      setTimeout(()=>{

        navigate("/sales");

      },1000);

    }

    catch(error){

      console.error(
        "Create sale error",
        error
      );

      setSnackbar({

        open:true,

        message:"Failed to create sale",

        type:"error"

      });

    }

    finally{

      setLoading(false);

    }

  };



  return (

    <Box

      sx={{

        minHeight:"100vh",

        background:
          "linear-gradient(135deg,#020617,#0f172a,#1e293b)",

        py:5

      }}

    >

      <Container

        maxWidth="lg"

        sx={{

          py:2

        }}

      >

        <Paper

          sx={{

            p:5,

            background:"#111827",

            borderRadius:4,

            color:"#fff",

            border:"1px solid #334155",

            boxShadow:"0 10px 30px rgba(0,0,0,0.35)"

          }}

        >

          <Typography

            variant="h4"

            fontWeight="700"

            mb={4}

          >

            Add Sale

          </Typography>

          <Box

            display="grid"

            gridTemplateColumns={{

              xs:"1fr",

              md:"repeat(2,1fr)"

            }}

            gap={3}

          >

                      <TextField
              label="Invoice Number"
              value="Auto Generated"
              fullWidth
              InputProps={{
                readOnly:true
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="Sale Date & Time"
              type="datetime-local"
              value={saleDate}
              fullWidth
              onChange={(e)=>
                setSaleDate(
                  e.target.value
                )
              }
              InputLabelProps={{
                shrink:true
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="Customer Name"
              value={customerName}
              fullWidth
              onChange={(e)=>
                setCustomerName(
                  e.target.value
                )
              }
              sx={textFieldStyle}
            />

            <TextField
              select
              label="Product"
              value={productId}
              fullWidth
              onChange={(e)=>
                handleProductChange(
                  e.target.value
                )
              }
              sx={textFieldStyle}
            >
              {
                products.length > 0
                ?
                products.map(
                  (product:any)=>(
                    <MenuItem
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </MenuItem>
                  )
                )
                :
                <MenuItem disabled>
                  No products available
                </MenuItem>
              }
            </TextField>

            <TextField
              label="Category"
              value={category}
              fullWidth
              InputProps={{
                readOnly:true
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="SKU"
              value={sku}
              fullWidth
              InputProps={{
                readOnly:true
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="Available Stock"
              value={availableStock}
              fullWidth
              InputProps={{
                readOnly:true
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="Quantity"
              type="number"
              value={quantity}
              fullWidth
              onChange={(e)=>
                setQuantity(
                  Number(e.target.value)
                )
              }
              inputProps={{
                min:1
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="Unit Price"
              type="number"
              value={unitPrice}
              fullWidth
              onChange={(e)=>
                setUnitPrice(
                  Number(e.target.value)
                )
              }
              inputProps={{
                min:0
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="Discount (%)"
              type="number"
              value={discount}
              fullWidth
              onChange={(e)=>
                setDiscount(
                  Number(e.target.value)
                )
              }
              inputProps={{
                min:0,
                max:100
              }}
              sx={textFieldStyle}
            />

            <TextField
              label="Tax (%)"
              type="number"
              value={tax}
              fullWidth
              onChange={(e)=>
                setTax(
                  Number(e.target.value)
                )
              }
              inputProps={{
                min:0
              }}
              sx={textFieldStyle}
            />

            <TextField
              select
              label="Sales Channel"
              value={salesChannel}
              fullWidth
              onChange={(e)=>
                setSalesChannel(
                  e.target.value
                )
              }
              sx={textFieldStyle}
            >
              <MenuItem value="Retail Store">
                Retail Store
              </MenuItem>

              <MenuItem value="Online Store">
                Online Store
              </MenuItem>

              <MenuItem value="Marketplace">
                Marketplace
              </MenuItem>
            </TextField>

            <TextField
              select
              label="Payment Method"
              value={paymentMethod}
              fullWidth
              onChange={(e)=>
                setPaymentMethod(
                  e.target.value
                )
              }
              sx={textFieldStyle}
            >
              <MenuItem value="Cash">
                Cash
              </MenuItem>

              <MenuItem value="Card">
                Card
              </MenuItem>

              <MenuItem value="UPI">
                UPI
              </MenuItem>

              <MenuItem value="Bank Transfer">
                Bank Transfer
              </MenuItem>
            </TextField>

          </Box>


                    <Paper
            sx={{
              mt:5,
              p:4,
              background:"#1e293b",
              border:"1px solid #334155",
              borderRadius:3,
              color:"#fff",
              boxShadow:"0 8px 20px rgba(0,0,0,0.25)"
            }}
          >

            <Typography
              variant="h6"
              fontWeight="700"
              mb={3}
            >
              Invoice Summary
            </Typography>

            <Box
              display="grid"
              gridTemplateColumns={{
                xs:"1fr",
                md:"repeat(2,1fr)"
              }}
              gap={2}
            >

              <Typography>
                <strong>Product :</strong>{" "}
                {productName || "-"}
              </Typography>

              <Typography>
                <strong>Category :</strong>{" "}
                {category || "-"}
              </Typography>

              <Typography>
                <strong>SKU :</strong>{" "}
                {sku || "-"}
              </Typography>

              <Typography>
                <strong>Quantity :</strong>{" "}
                {quantity}
              </Typography>

              <Typography>
                <strong>Unit Price :</strong>{" "}
                ₹{unitPrice.toFixed(2)}
              </Typography>

              <Typography>
                <strong>Subtotal :</strong>{" "}
                ₹{subtotal.toFixed(2)}
              </Typography>

              <Typography>
                <strong>Discount :</strong>{" "}
                ₹{discountAmount.toFixed(2)}
              </Typography>

              <Typography>
                <strong>Tax :</strong>{" "}
                ₹{taxAmount.toFixed(2)}
              </Typography>

            </Box>

            <Box
              mt={3}
              pt={2}
              borderTop="1px solid #475569"
            >
              <Typography
                variant="h5"
                fontWeight="700"
                color="#60a5fa"
              >
                Total Amount : ₹{totalAmount.toFixed(2)}
              </Typography>
            </Box>

          </Paper>



          <Box
            display="flex"
            justifyContent="flex-end"
            gap={2}
            mt={4}
          >

            <Button
              variant="outlined"
              onClick={()=>navigate("/sales")}
              sx={{
                px:4,
                textTransform:"none",
                fontWeight:600,
                borderColor:"#64748b",
                color:"#fff",
                "&:hover":{
                  borderColor:"#94a3b8",
                  background:"#1e293b"
                }
              }}
            >
              Cancel
            </Button>



            <Button
              variant="contained"
              disabled={
                loading ||
                !productId ||
                quantity <= 0 ||
                quantity > availableStock
              }
              onClick={handleSubmit}
              sx={{
                px:4,
                textTransform:"none",
                fontWeight:700,
                background:"#2563eb",
                "&:hover":{
                  background:"#1d4ed8"
                },
                "&.Mui-disabled":{
                  background:"#334155",
                  color:"#94a3b8"
                }
              }}
            >
              {
                loading
                ?
                "Saving..."
                :
                "Save Sale"
              }
            </Button>

          </Box>

        </Paper>

      </Container>



      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={()=>
          setSnackbar({
            ...snackbar,
            open:false
          })
        }
      >

        <Alert
          severity={snackbar.type}
          onClose={()=>
            setSnackbar({
              ...snackbar,
              open:false
            })
          }
        >
          {snackbar.message}
        </Alert>

      </Snackbar>

    </Box>

  );

}