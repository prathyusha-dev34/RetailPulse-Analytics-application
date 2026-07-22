import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import {
  Add,
  Delete,
  Edit,
  Search,
  ToggleOff,
  ToggleOn,
} from "@mui/icons-material";


import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  activateProduct,
  deactivateProduct,
} from "../api/productApi";


import { getCategories } from "../api/categoryApi";



interface Category {

  id:number;

  name:string;

}



interface Product {

  id:number;

  category_id:number;

  category_name?:string;

  name:string;

  sku:string;

  brand:string;

  description:string;

  unit_price:number;

  cost_price:number;

  stock_quantity:number;

  unit_of_measure:string;

  status:string;

}



const emptyProduct = {

  category_id:0,

  name:"",

  sku:"",

  brand:"",

  description:"",

  unit_price:0,

  cost_price:0,

  stock_quantity:0,

  unit_of_measure:"",

  status:"ACTIVE",

};





export default function Products(){


  const [products,setProducts] =
    useState<Product[]>([]);


  const [categories,setCategories] =
    useState<Category[]>([]);



  const [search,setSearch] =
    useState("");

  const [categoryFilter,setCategoryFilter] =
    useState("");

  const [brandFilter,setBrandFilter] =
    useState("");

  const [statusFilter,setStatusFilter] =
    useState("");



  const [open,setOpen] =
    useState(false);


  const [editingId,setEditingId] =
    useState<number|null>(null);



  const [form,setForm] =
    useState(emptyProduct);






  useEffect(()=>{

    loadProducts();

    loadCategories();

  },[]);






  useEffect(()=>{

    loadProducts();

  },[
    search,
    categoryFilter,
    brandFilter,
    statusFilter
  ]);







  async function loadProducts(){

    try{


      const res =
        await getProducts({

          search,

          category_id:
            categoryFilter
            ? Number(categoryFilter)
            : undefined,


          brand:
            brandFilter || undefined,


          status:
            statusFilter || undefined,


        });



      setProducts(res.data);



    }catch(err){

      console.log(err);

    }

  }







  async function loadCategories(){

    try{


      const res =
        await getCategories();


      setCategories(res.data);



    }catch(err){

      console.log(err);

    }

  }








  function handleAdd(){


    setEditingId(null);


    setForm(emptyProduct);


    setOpen(true);


  }







  function handleEdit(product:Product){


    setEditingId(product.id);



    setForm({

      category_id:product.category_id,

      name:product.name,

      sku:product.sku,

      brand:product.brand,

      description:product.description,

      unit_price:product.unit_price,

      cost_price:product.cost_price,

      stock_quantity:product.stock_quantity,

      unit_of_measure:product.unit_of_measure,

      status:product.status,

    });



    setOpen(true);



  }








  async function handleSave(){


    if(!form.name.trim()){

      alert("Product Name is required");

      return;

    }



    if(!form.sku.trim()){

      alert("SKU is required");

      return;

    }



    if(form.category_id===0){

      alert("Category is required");

      return;

    }



    if(form.unit_price<=0){

      alert(
        "Unit Price must be greater than zero"
      );

      return;

    }



    if(form.cost_price > form.unit_price){

      alert(
        "Cost Price cannot exceed Unit Price"
      );

      return;

    }



    try{


      if(editingId){

        await updateProduct(
          editingId,
          form
        );


      }else{


        await createProduct(form);


      }



      setOpen(false);


      setForm(emptyProduct);


      loadProducts();



    }catch(err){


      console.log(err);


    }


  }

    async function handleToggle(product: Product) {

    try {

      if (product.status === "ACTIVE") {

        await deactivateProduct(product.id);

      } else {

        await activateProduct(product.id);

      }


      loadProducts();


    } catch (err) {

      console.log(err);

    }

  }






  async function handleDelete(id:number) {

    try {


      await deleteProduct(id);


      loadProducts();



    } catch(err) {


      console.log(err);


    }

  }






  return (

    <Box
      sx={{
        display:"flex",
        minHeight:"100vh",
        bgcolor:"#0F172A",
      }}
    >


      <Sidebar />



      <Box
        sx={{
          flex:1,
          ml:"260px",
        }}
      >



        <Topbar />





        <Container
          maxWidth="xl"
          sx={{
            mt:12,
            pb:4,
          }}
        >





          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            mb={3}
          >


            <Typography
              variant="h4"
              color="white"
              fontWeight={700}
            >

              Products

            </Typography>





            <Button

              variant="contained"

              startIcon={<Add />}

              onClick={handleAdd}

            >

              Add Product

            </Button>



          </Stack>









          <Stack
            direction="row"
            spacing={2}
            mb={3}
          >





            <TextField

              placeholder="Search by Product / SKU / Brand"

              value={search}

              onChange={(e)=>
                setSearch(e.target.value)
              }


              InputProps={{

                startAdornment:(

                  <InputAdornment position="start">

                    <Search
                      sx={{
                        color:"white"
                      }}
                    />

                  </InputAdornment>

                )

              }}



              sx={{


                flex:1,


                "& .MuiOutlinedInput-root":{


                  bgcolor:"#1E293B",


                  color:"white",


                  "& fieldset":{

                    borderColor:"white",

                  },


                  "&:hover fieldset":{

                    borderColor:"white",

                  },


                  "&.Mui-focused fieldset":{

                    borderColor:"white",

                  },


                },


                "& input::placeholder":{

                  color:"white",

                  opacity:0.7,

                }


              }}



            />









            <FormControl
              sx={{
                minWidth:200,
              }}
            >



              <InputLabel

                sx={{

                  color:"white",


                  "&.Mui-focused":{

                    color:"white",

                  }

                }}

              >

                Category

              </InputLabel>





              <Select


                value={categoryFilter}


                label="Category"


                onChange={(e)=>

                  setCategoryFilter(
                    e.target.value
                  )

                }



                sx={{


                  bgcolor:"#1E293B",


                  color:"white",



                  "& .MuiOutlinedInput-notchedOutline":{

                    borderColor:"white",

                  },


                  "&:hover .MuiOutlinedInput-notchedOutline":{

                    borderColor:"white",

                  },


                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":{

                    borderColor:"white",

                  },


                  ".MuiSvgIcon-root":{

                    color:"white",

                  }


                }}


              >



                <MenuItem value="">

                  All

                </MenuItem>





                {
                  categories.map((cat)=>(


                    <MenuItem

                      key={cat.id}

                      value={cat.id}

                    >

                      {cat.name}


                    </MenuItem>


                  ))
                }



              </Select>



            </FormControl>






            <TextField

              label="Brand"


              value={brandFilter}


              onChange={(e)=>

                setBrandFilter(
                  e.target.value
                )

              }



              InputLabelProps={{

                sx:{

                  color:"white",

                  "&.Mui-focused":{

                    color:"white",

                  }

                }

              }}




              sx={{


                "& .MuiOutlinedInput-root":{


                  bgcolor:"#1E293B",


                  color:"white",



                  "& fieldset":{

                    borderColor:"white",

                  },



                  "&:hover fieldset":{

                    borderColor:"white",

                  },



                  "&.Mui-focused fieldset":{

                    borderColor:"white",

                  }


                }


              }}


            />


            



            <FormControl
              sx={{
                minWidth:180,
              }}
            >


              <InputLabel

                sx={{

                  color:"white",

                  "&.Mui-focused":{

                    color:"white",

                  }

                }}

              >

                Status

              </InputLabel>





              <Select

                value={statusFilter}

                label="Status"


                onChange={(e)=>

                  setStatusFilter(
                    e.target.value
                  )

                }



                sx={{


                  bgcolor:"#1E293B",


                  color:"white",


                  "& .MuiOutlinedInput-notchedOutline":{

                    borderColor:"white",

                  },


                  "&:hover .MuiOutlinedInput-notchedOutline":{

                    borderColor:"white",

                  },


                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":{

                    borderColor:"white",

                  },


                  ".MuiSvgIcon-root":{

                    color:"white",

                  }


                }}



              >


                <MenuItem value="">

                  All

                </MenuItem>


                <MenuItem value="ACTIVE">

                  Active

                </MenuItem>


                <MenuItem value="INACTIVE">

                  Inactive

                </MenuItem>



              </Select>


            </FormControl>




          </Stack>









          <Paper
            sx={{
              bgcolor:"#1E293B",
            }}
          >


            <TableContainer>


              <Table>


                <TableHead>


                  <TableRow>


                    {
                      [
                        "Product",
                        "SKU",
                        "Category",
                        "Brand",
                        "Price",
                        "Stock",
                        "Status",
                        "Actions",
                      ].map((item)=>(


                        <TableCell

                          key={item}

                          sx={{
                            color:"white"
                          }}

                        >

                          {item}

                        </TableCell>


                      ))
                    }



                  </TableRow>


                </TableHead>





                <TableBody>


                  {
                    products.map((product)=>(


                      <TableRow

                        key={product.id}

                      >


                        <TableCell sx={{color:"white"}}>

                          {product.name}

                        </TableCell>



                        <TableCell sx={{color:"white"}}>

                          {product.sku}

                        </TableCell>



                        <TableCell sx={{color:"white"}}>

                          {product.category_name}

                        </TableCell>



                        <TableCell sx={{color:"white"}}>

                          {product.brand}

                        </TableCell>



                        <TableCell sx={{color:"white"}}>

                          ₹{product.unit_price}

                        </TableCell>



                        <TableCell sx={{color:"white"}}>

                          {product.stock_quantity}

                        </TableCell>



                        <TableCell sx={{color:"white"}}>

                          {product.status}

                        </TableCell>





                        <TableCell align="right">


                          <IconButton

                            color="primary"

                            onClick={()=>
                              handleEdit(product)
                            }

                          >

                            <Edit />

                          </IconButton>





                          <IconButton

                            color="success"

                            onClick={()=>
                              handleToggle(product)
                            }

                          >


                            {

                              product.status==="ACTIVE"

                              ?

                              <ToggleOff />

                              :

                              <ToggleOn />

                            }


                          </IconButton>





                          <IconButton

                            color="error"

                            onClick={()=>
                              handleDelete(product.id)
                            }

                          >

                            <Delete />

                          </IconButton>



                        </TableCell>



                      </TableRow>


                    ))
                  }



                </TableBody>



              </Table>



            </TableContainer>



          </Paper>







          <Dialog

            open={open}

            onClose={()=>
              setOpen(false)
            }

            fullWidth

            maxWidth="md"

          >



            <DialogTitle>

              {
                editingId
                ?
                "Edit Product"
                :
                "Add Product"
              }


            </DialogTitle>





            <DialogContent>


              <Stack
                spacing={2}
                sx={{
                  mt:1,
                }}
              >


                <TextField

                  label="Product Name"

                  fullWidth

                  value={form.name}

                  onChange={(e)=>

                    setForm({

                      ...form,

                      name:e.target.value,

                    })

                  }

                />



                <TextField

                  label="SKU"

                  fullWidth

                  value={form.sku}

                  onChange={(e)=>

                    setForm({

                      ...form,

                      sku:e.target.value,

                    })

                  }

                />




                <TextField

                  label="Brand"

                  fullWidth

                  value={form.brand}

                  onChange={(e)=>

                    setForm({

                      ...form,

                      brand:e.target.value,

                    })

                  }

                />





                <TextField

                  label="Unit Price"

                  type="number"

                  fullWidth

                  value={form.unit_price}

                  onChange={(e)=>

                    setForm({

                      ...form,

                      unit_price:Number(
                        e.target.value
                      ),

                    })

                  }

                />





                <TextField

                  label="Stock Quantity"

                  type="number"

                  fullWidth

                  value={form.stock_quantity}

                  onChange={(e)=>

                    setForm({

                      ...form,

                      stock_quantity:Number(
                        e.target.value
                      ),

                    })

                  }

                />



              </Stack>


            </DialogContent>





            <DialogActions>


              <Button

                onClick={()=>
                  setOpen(false)
                }

              >

                Cancel

              </Button>




              <Button

                variant="contained"

                onClick={handleSave}

              >

                {
                  editingId
                  ?
                  "Update"
                  :
                  "Save"
                }


              </Button>



            </DialogActions>



          </Dialog>





        </Container>



      </Box>



    </Box>



  );


}