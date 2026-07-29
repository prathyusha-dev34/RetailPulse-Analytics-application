import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  MenuItem,
  Paper,
  Snackbar,
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
  Visibility,
  PointOfSale,
  TrendingUp,
  ShoppingCart,
  CurrencyRupee,
} from "@mui/icons-material";


import { useNavigate } from "react-router-dom";


import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


import {
  getSales,
  deleteSale,
  getDashboardSummary,
  getLowStockProducts,
  getOutOfStockProducts,
} from "../api/salesApi";



interface Sale {

  id:number;

  invoice_number:string;

  customer_name:string;

  sale_date:string;

  sales_channel:string;

  payment_method:string;

  total_amount:number;

  status?:string;

}



interface DashboardSummary {

  total_sales:number;

  total_revenue:number;

  total_orders:number;

  average_order_value:number;

}




export default function Sales(){


  const navigate = useNavigate();



  const [sales,setSales] =
    useState<Sale[]>([]);



  const [summary,setSummary] =
    useState<DashboardSummary>({
      total_sales:0,
      total_revenue:0,
      total_orders:0,
      average_order_value:0,
    });



  const [lowStock,setLowStock] =
    useState<any[]>([]);



  const [outOfStock,setOutOfStock] =
    useState<any[]>([]);



  const [search,setSearch] =
    useState("");



  const [channel,setChannel] =
    useState("");



  const [payment,setPayment] =
    useState("");



  const [loading,setLoading] =
    useState(true);



  const [snackbar,setSnackbar] =
    useState({

      open:false,

      message:"",

      severity:
        "success" as
        "success" |
        "error",

    });



  useEffect(()=>{

    loadData();

  },[]);


    const loadData = async () => {

  try {

    setLoading(true);

    const [
      salesRes,
      summaryRes,
      lowRes,
      outRes,
    ] = await Promise.all([
      getSales(),
      getDashboardSummary(),
      getLowStockProducts(),
      getOutOfStockProducts(),
    ]);


    console.log("SALES RESPONSE 👉", salesRes);
    console.log("LOW STOCK RESPONSE 👉", lowRes);
    console.log("OUT STOCK RESPONSE 👉", outRes);

    const salesData = Array.isArray(salesRes)
      ? salesRes
      : salesRes.data ?? [];


    setSales(salesData);


    setSummary(
      summaryRes.data ?? summaryRes
    );


    setLowStock(
      Array.isArray(lowRes)
        ? lowRes
        : lowRes.data ?? []
    );


    setOutOfStock(
      Array.isArray(outRes)
        ? outRes
        : outRes.data ?? []
    );


  } catch(error) {

    console.error(
      "Sales loading error:",
      error
    );

  } finally {

    setLoading(false);

  }

};


  const handleDelete = async(
    id:number
  )=>{


    const confirmDelete =
      window.confirm(
        "Delete this sale?"
      );


    if(!confirmDelete)
      return;



    try{


      await deleteSale(id);



      setSnackbar({

        open:true,

        message:
          "Sale deleted successfully",

        severity:"success",

      });



      loadData();



    }catch(error){


      console.error(error);



      setSnackbar({

        open:true,

        message:
          "Unable to delete sale",

        severity:"error",

      });


    }


  };




  const formatCurrency = (
    value:number
  )=>{


    return Number(
      value || 0
    ).toLocaleString(
      "en-IN",
      {
        style:"currency",
        currency:"INR",
      }
    );


  };




  const formatDate = (
    value:string
  )=>{


    if(!value)
      return "-";


    return new Date(value)
      .toLocaleString("en-IN");


  };




  const filteredSales =
    useMemo(()=>{


      let data = [
        ...sales
      ];



      if(search.trim()){


        const text =
          search.toLowerCase();



        data =
          data.filter(
            (sale)=>

              sale.invoice_number
              ?.toLowerCase()
              .includes(text)

              ||

              sale.customer_name
              ?.toLowerCase()
              .includes(text)

          );


      }




      if(channel){


        data =
          data.filter(
            (sale)=>
              sale.sales_channel === channel
          );


      }




      if(payment){


        data =
          data.filter(
            (sale)=>
              sale.payment_method === payment
          );


      }




      return data;



    },[
      sales,
      search,
      channel,
      payment,
    ]);



    const cardStyle = {

    background:
      "linear-gradient(135deg,#1E293B,#334155)",

    color:"#fff",

    borderRadius:4,

    height:"100%",

    border:
      "1px solid #334155",

  };



  if(loading){

    return (

      <Box
        sx={{
          minHeight:"100vh",
          bgcolor:"#0F172A",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
        }}
      >

        <Typography
          color="white"
          variant="h6"
        >
          Loading Sales...
        </Typography>


      </Box>

    );

  }



  return (

    <Box

      sx={{

        display:"flex",

        bgcolor:"#0F172A",

        minHeight:"100vh",

      }}

    >


      <Sidebar />



      <Box

        component="main"

        sx={{

          flexGrow:1,

          ml:"260px",

        }}

      >


        <Topbar />



        <Container

          maxWidth="xl"

          sx={{

            mt:4,

            pb:5,

          }}

        >



          <Box

            display="flex"

            justifyContent="space-between"

            alignItems="center"

            flexWrap="wrap"

            gap={2}

            mb={4}

          >


            <Typography

              variant="h4"

              fontWeight={700}

              color="white"

            >

              Sales Management

            </Typography>



            <Button

              variant="contained"

              startIcon={<Add />}

              onClick={()=>navigate("/sales/add")}

              sx={{

                textTransform:"none",

                borderRadius:3,

                fontWeight:700,

              }}

            >

              Add Sale

            </Button>



          </Box>




          <Grid

            container

            spacing={3}

            mb={4}

          >



            <Grid

              size={{
                xs:12,
                md:3
              }}

            >

              <Card sx={cardStyle}>

                <CardContent>


                  <PointOfSale

                    sx={{

                      fontSize:38,

                      color:"#60A5FA",

                    }}

                  />


                  <Typography

                    mt={2}

                    color="#CBD5E1"

                  >

                    Total Sales

                  </Typography>



                  <Typography

                    variant="h5"

                    fontWeight={700}

                  >

                    {summary.total_sales}

                  </Typography>



                </CardContent>


              </Card>


            </Grid>





            <Grid

              size={{
                xs:12,
                md:3
              }}

            >


              <Card sx={cardStyle}>


                <CardContent>


                  <CurrencyRupee

                    sx={{

                      fontSize:38,

                      color:"#22C55E",

                    }}

                  />


                  <Typography

                    mt={2}

                    color="#CBD5E1"

                  >

                    Revenue

                  </Typography>



                  <Typography

                    variant="h5"

                    fontWeight={700}

                  >

                    {formatCurrency(
                      summary.total_revenue
                    )}

                  </Typography>



                </CardContent>


              </Card>


            </Grid>





            <Grid

              size={{
                xs:12,
                md:3
              }}

            >


              <Card sx={cardStyle}>


                <CardContent>


                  <ShoppingCart

                    sx={{

                      fontSize:38,

                      color:"#F59E0B",

                    }}

                  />



                  <Typography

                    mt={2}

                    color="#CBD5E1"

                  >

                    Orders

                  </Typography>



                  <Typography

                    variant="h5"

                    fontWeight={700}

                  >

                    {summary.total_orders}

                  </Typography>



                </CardContent>


              </Card>


            </Grid>





            <Grid

              size={{
                xs:12,
                md:3
              }}

            >


              <Card sx={cardStyle}>


                <CardContent>


                  <TrendingUp

                    sx={{

                      fontSize:38,

                      color:"#EC4899",

                    }}

                  />



                  <Typography

                    mt={2}

                    color="#CBD5E1"

                  >

                    Average Order

                  </Typography>



                  <Typography

                    variant="h5"

                    fontWeight={700}

                  >

                    {formatCurrency(
                      summary.average_order_value
                    )}

                  </Typography>



                </CardContent>


              </Card>


            </Grid>



          </Grid>


          {/* STOCK ALERTS */}

          <Grid
            container
            spacing={3}
            mb={4}
          >


            <Grid
              size={{
                xs:12,
                md:6
              }}
            >

              <Card

                sx={{

                  bgcolor:"#1E293B",

                  color:"#fff",

                  borderRadius:4,

                  border:
                    "1px solid #334155",

                  height:"100%",

                }}

              >

                <CardContent>


                  <Typography

                    variant="h6"

                    fontWeight={700}

                    color="#F59E0B"

                    mb={2}

                  >

                    Low Stock Products

                  </Typography>



                  {
                    lowStock.length === 0 ? (

                      <Typography
                        color="#CBD5E1"
                      >

                        No Low Stock Products

                      </Typography>


                    ) : (


                      <Stack
                        direction="row"
                        flexWrap="wrap"
                        gap={1}
                      >


                        {
                          lowStock.map(
                            (item:any)=>(

                              <Chip

                                key={item.id}

                                label={
                                  `${
                                    item.name ??
                                    item.product_name ??
                                    "Product"
                                  } (${
                                    item.available_stock ??
                                    0
                                  })`
                                }

                                color="warning"

                              />

                            )
                          )
                        }


                      </Stack>


                    )
                  }



                </CardContent>


              </Card>


            </Grid>





            <Grid

              size={{
                xs:12,
                md:6
              }}

            >


              <Card

                sx={{

                  bgcolor:"#1E293B",

                  color:"#fff",

                  borderRadius:4,

                  border:
                    "1px solid #334155",

                  height:"100%",

                }}

              >


                <CardContent>


                  <Typography

                    variant="h6"

                    fontWeight={700}

                    color="#EF4444"

                    mb={2}

                  >

                    Out Of Stock Products

                  </Typography>



                  {
                    outOfStock.length === 0 ? (

                      <Typography
                        color="#CBD5E1"
                      >

                        No Out Of Stock Products

                      </Typography>


                    ) : (


                      <Stack

                        direction="row"

                        flexWrap="wrap"

                        gap={1}

                      >


                        {
                          outOfStock.map(
                            (item:any)=>(

                              <Chip

                                key={item.id}

                                label={
                                  item.name ??
                                  item.product_name ??
                                  "Product"
                                }

                                color="error"

                              />

                            )
                          )
                        }


                      </Stack>


                    )
                  }



                </CardContent>


              </Card>


            </Grid>



          </Grid>






          {/* FILTER SECTION */}


          <Paper

            sx={{

              bgcolor:"#1E293B",

              p:3,

              mb:4,

              borderRadius:4,

            }}

          >


            <Typography

              color="white"

              fontWeight={700}

              mb={2}

            >

              Filters

            </Typography>




            <Grid

              container

              spacing={2}

            >



              <Grid

                size={{
                  xs:12,
                  md:4
                }}

              >

                <TextField

                  fullWidth

                  label="Search Invoice / Customer"

                  value={search}

                  onChange={(e)=>
                    setSearch(e.target.value)
                  }

                  sx={{

                    input:{
                      color:"#fff",
                    },

                    label:{
                      color:"#CBD5E1",
                    }

                  }}

                />

              </Grid>





              <Grid

                size={{
                  xs:12,
                  md:4
                }}

              >


                <TextField

                  fullWidth

                  select

                  label="Sales Channel"

                  value={channel}

                  onChange={(e)=>
                    setChannel(e.target.value)
                  }


                  sx={{

                    input:{
                      color:"#fff",
                    },

                    label:{
                      color:"#CBD5E1",
                    }

                  }}

                >


                  <MenuItem value="">

                    All

                  </MenuItem>


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


              </Grid>





              <Grid

                size={{
                  xs:12,
                  md:4
                }}

              >


                <TextField

                  fullWidth

                  select

                  label="Payment Method"

                  value={payment}

                  onChange={(e)=>
                    setPayment(e.target.value)
                  }


                  sx={{

                    input:{
                      color:"#fff",
                    },

                    label:{
                      color:"#CBD5E1",
                    }

                  }}

                >


                  <MenuItem value="">

                    All

                  </MenuItem>


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


              </Grid>




            </Grid>


          </Paper>


          {/* SALES TABLE */}

<Paper
  sx={{
    bgcolor: "#1E293B",
    borderRadius: 3,
    overflow: "hidden",
  }}
>

  <Box
    p={3}
  >

    <Typography
      color="white"
      variant="h6"
      fontWeight={700}
    >
      Sales Transactions
    </Typography>

  </Box>


  <TableContainer>

    <Table>

      <TableHead>

        <TableRow
          sx={{
            bgcolor:"#0F172A",
          }}
        >

          <TableCell sx={{color:"#CBD5E1"}}>
            Invoice
          </TableCell>

          <TableCell sx={{color:"#CBD5E1"}}>
            Customer
          </TableCell>

          <TableCell sx={{color:"#CBD5E1"}}>
            Date
          </TableCell>

          <TableCell sx={{color:"#CBD5E1"}}>
            Channel
          </TableCell>

          <TableCell sx={{color:"#CBD5E1"}}>
            Payment
          </TableCell>

          <TableCell sx={{color:"#CBD5E1"}}>
            Amount
          </TableCell>

          <TableCell sx={{color:"#CBD5E1"}}>
            Actions
          </TableCell>

        </TableRow>

      </TableHead>


      <TableBody>


        {
          filteredSales.length === 0 ? (

            <TableRow>

              <TableCell
                colSpan={7}
                align="center"
                sx={{
                  color:"gray",
                  py:5,
                }}
              >

                No sales found

              </TableCell>

            </TableRow>


          ) : (


            filteredSales.map(
              (sale) => (

                <TableRow
                  key={sale.id}
                  hover
                  sx={{
                    "& td":{
                      color:"#fff",
                      borderColor:"#334155",
                    },
                  }}
                >


                  <TableCell>
                    {sale.invoice_number}
                  </TableCell>


                  <TableCell>
                    {sale.customer_name}
                  </TableCell>


                  <TableCell>

                    {
                      new Date(
                        sale.sale_date
                      ).toLocaleDateString(
                        "en-IN"
                      )
                    }

                  </TableCell>


                  <TableCell>

                    <Chip
                      label={
                        sale.sales_channel ||
                        "N/A"
                      }
                      size="small"
                      sx={{
                        bgcolor:"#2563EB",
                        color:"#fff",
                      }}
                    />

                  </TableCell>


                  <TableCell>

                    <Chip
                      label={
                        sale.payment_method ||
                        "N/A"
                      }
                      size="small"
                      sx={{
                        bgcolor:"#334155",
                        color:"#fff",
                      }}
                    />

                  </TableCell>


                  <TableCell>

                    <Typography
                      fontWeight={700}
                    >

                      {formatCurrency(
                        sale.total_amount
                      )}

                    </Typography>

                  </TableCell>


                  <TableCell>


                    <Stack
                      direction="row"
                      spacing={1}
                    >


                      {/* VIEW */}

                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          minWidth:40,
                          bgcolor:"#2563EB",
                        }}
                        onClick={() =>
                          navigate(
                            `/sales/${sale.id}`
                          )
                        }
                      >

                        <Visibility
                          fontSize="small"
                        />

                      </Button>



                      {/* EDIT */}

                      <Button
                        size="small"
                        variant="contained"
                        sx={{
                          minWidth:40,
                          bgcolor:"#F59E0B",
                        }}
                        onClick={() =>
                          navigate(
                            `/sales/edit/${sale.id}`
                          )
                        }
                      >

                        <Edit
                          fontSize="small"
                        />

                      </Button>



                      {/* DELETE */}

                      <Button
                        size="small"
                        variant="contained"
                        color="error"
                        sx={{
                          minWidth:40,
                        }}
                        onClick={() =>
                          handleDelete(
                            sale.id
                          )
                        }
                      >

                        <Delete
                          fontSize="small"
                        />

                      </Button>


                    </Stack>


                  </TableCell>


                </TableRow>

              )
            )


          )
        }


      </TableBody>


    </Table>


  </TableContainer>


</Paper>


{/* SNACKBAR */}

<Snackbar
  open={snackbar.open}
  autoHideDuration={3000}
  onClose={() =>
    setSnackbar({
      ...snackbar,
      open:false,
    })
  }
  anchorOrigin={{
    vertical:"bottom",
    horizontal:"right",
  }}
>

  <Alert
    severity={snackbar.severity}
    variant="filled"
    onClose={() =>
      setSnackbar({
        ...snackbar,
        open:false,
      })
    }
    sx={{
      width:"100%",
    }}
  >

    {snackbar.message}

  </Alert>

</Snackbar>

</Container>

</Box>

</Box>

);
}

