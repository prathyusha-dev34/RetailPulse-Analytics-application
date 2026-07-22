import {
  useEffect,
  useState
} from "react";


import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";


import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import PrintIcon from "@mui/icons-material/Print";


import {
  useNavigate,
  useParams
} from "react-router-dom";


import {
  getSale
} from "../api/salesApi";



export default function SaleDetails(){


  const { id } = useParams();


  const navigate = useNavigate();



  const [sale,setSale] =
  useState<any>(null);



  const [loading,setLoading] =
  useState(true);



  const [snackbar,setSnackbar] =
  useState({

    open:false,

    message:"",

    severity:
    "success" as
    "success" |
    "error" |
    "info"

  });




  useEffect(()=>{

    loadSale();

  },[]);





  const loadSale = async()=>{


    try{


      setLoading(true);



      const response:any =
      await getSale(
        Number(id)
      );



      const saleData =

      response?.data?.sale ??

      response?.data?.data ??

      response?.data ??

      null;



      setSale(
        saleData
      );



    }
    catch(error){


      console.error(
        error
      );



      setSnackbar({

        open:true,

        message:
        "Unable to load sale details",

        severity:
        "error"

      });


    }
    finally{


      setLoading(false);


    }


  };





  const formatCurrency = (
    value:any
  )=>{


    return Number(
      value || 0
    )
    .toLocaleString(
      "en-IN",
      {

        style:"currency",

        currency:"INR"

      }
    );


  };





  const formatDate = (
    value:any
  )=>{


    if(!value)

      return "-";



    return new Date(
      value
    )
    .toLocaleString(
      "en-IN"
    );


  };





  if(loading){


    return (

      <Container>

        <Typography
          mt={5}
          color="white"
        >

          Loading sale details...

        </Typography>

      </Container>

    );


  }



  if(!sale){


    return (

      <Container>

        <Typography
          mt={5}
          color="white"
        >

          Sale not found

        </Typography>

      </Container>

    );


  }





  const items =
  sale.items ?? [];





  const subtotal =
  items.reduce(

    (
      sum:number,
      item:any
    )=>

    sum +

    (
      Number(
        item.quantity || 0
      )

      *

      Number(
        item.unit_price || 0
      )

    ),

    0

  );





  const discount =
  items.reduce(

    (
      sum:number,
      item:any
    )=>

    sum +

    Number(
      item.discount || 0
    ),

    0

  );





  const tax =
  items.reduce(

    (
      sum:number,
      item:any
    )=>

    sum +

    Number(
      item.tax || 0
    ),

    0

  );





  const totalQuantity =
  items.reduce(

    (
      sum:number,
      item:any
    )=>

    sum +

    Number(
      item.quantity || 0
    ),

    0

  );





  const cardStyle = {

    background:"#111827",

    color:"#fff",

    borderRadius:3,

    border:
    "1px solid #1e293b",

    height:"100%"

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



      <Container maxWidth="xl">





        <Paper

          sx={{

            p:4,

            mb:4,

            background:"#111827",

            color:"#fff",

            borderRadius:4,

            border:
            "1px solid #1e293b"

          }}

        >




          <Box

            display="flex"

            justifyContent="space-between"

            alignItems="center"

            flexWrap="wrap"

            gap={3}

          >




            <Box>


              <Box

                display="flex"

                alignItems="center"

                gap={2}

                mb={2}

              >



                <ReceiptLongIcon

                  sx={{

                    fontSize:40,

                    color:"#60a5fa"

                  }}

                />



                <Typography

                  variant="h4"

                  fontWeight="700"

                >

                  Invoice Details

                </Typography>



              </Box>





              <Typography

                color="#94a3b8"

              >

                Invoice Number :

                {" "}

                <b>

                {sale.invoice_number || "-"}

                </b>


              </Typography>





              <Typography

                color="#94a3b8"

                mt={1}

              >

                Sale Date :

                {" "}

                {formatDate(
                  sale.sale_date
                )}

              </Typography>



            </Box>






            <Chip

              label="Completed"

              color="success"

              sx={{

                fontWeight:700,

                fontSize:15

              }}

            />



          </Box>




        </Paper>







        <Grid

          container

          spacing={3}

          mb={4}

        >




          <Grid

            item

            xs={12}

            md={3}

          >


            <Card

              sx={cardStyle}

            >

              <CardContent>


                <Typography

                  color="#94a3b8"

                >

                  Total Amount

                </Typography>



                <Typography

                  variant="h5"

                  fontWeight="700"

                  mt={1}

                >

                  {
                    formatCurrency(
                      sale.total_amount
                    )
                  }

                </Typography>



              </CardContent>


            </Card>



          </Grid>







          <Grid

            item

            xs={12}

            md={3}

          >


            <Card

              sx={cardStyle}

            >


              <CardContent>



                <Typography

                  color="#94a3b8"

                >

                  Total Products

                </Typography>




                <Typography

                  variant="h5"

                  fontWeight="700"

                  mt={1}

                >

                  {
                    items.length
                  }

                </Typography>



              </CardContent>


            </Card>



          </Grid>








          <Grid

            item

            xs={12}

            md={3}

          >


            <Card

              sx={cardStyle}

            >


              <CardContent>


                <Typography

                  color="#94a3b8"

                >

                  Quantity Sold

                </Typography>



                <Typography

                  variant="h5"

                  fontWeight="700"

                  mt={1}

                >

                  {
                    totalQuantity
                  }

                </Typography>



              </CardContent>


            </Card>



          </Grid>








          <Grid

            item

            xs={12}

            md={3}

          >


            <Card

              sx={cardStyle}

            >


              <CardContent>


                <Typography

                  color="#94a3b8"

                >

                  Payment

                </Typography>




                <Typography

                  variant="h6"

                  fontWeight="700"

                  mt={1}

                >

                  {
                    sale.payment_method || "-"
                  }

                </Typography>



              </CardContent>


            </Card>



          </Grid>





        </Grid>






        <Grid

          container

          spacing={3}

          mb={4}

        >



          <Grid

            item

            xs={12}

            md={4}

          >



            <Card

              sx={cardStyle}

            >


              <CardContent>


                <Typography

                  variant="h6"

                  fontWeight="700"

                >

                  Customer Information

                </Typography>




                <Divider

                  sx={{

                    my:2,

                    borderColor:"#334155"

                  }}

                />




                <Typography>

                  Customer :

                  {" "}

                  {
                    sale.customer_name || "-"
                  }

                </Typography>




                <Typography

                  mt={2}

                >

                  Invoice :

                  {" "}

                  {
                    sale.invoice_number || "-"
                  }

                </Typography>




                <Typography

                  mt={2}

                >

                  Date :

                  {" "}

                  {
                    formatDate(
                      sale.sale_date
                    )
                  }

                </Typography>




              </CardContent>



            </Card>



          </Grid>


          <Grid

            item

            xs={12}

            md={4}

          >



            <Card

              sx={cardStyle}

            >


              <CardContent>


                <Typography

                  variant="h6"

                  fontWeight="700"

                >

                  Payment Details

                </Typography>




                <Divider

                  sx={{

                    my:2,

                    borderColor:"#334155"

                  }}

                />




                <Typography>

                  Sales Channel :

                  {" "}

                  {
                    sale.sales_channel || "-"
                  }

                </Typography>





                <Typography

                  mt={2}

                >

                  Payment Method :

                  {" "}

                  {
                    sale.payment_method || "-"
                  }

                </Typography>




              </CardContent>


            </Card>



          </Grid>







          <Grid

            item

            xs={12}

            md={4}

          >



            <Card

              sx={cardStyle}

            >


              <CardContent>



                <Typography

                  variant="h6"

                  fontWeight="700"

                >

                  Product Details

                </Typography>




                <Divider

                  sx={{

                    my:2,

                    borderColor:"#334155"

                  }}

                />




                <Typography>

                  Product :

                  {" "}

                  {
                    items[0]?.product_name ||

                    items[0]?.product?.name ||

                    "-"
                  }

                </Typography>




                <Typography

                  mt={2}

                >

                  Category :

                  {" "}

                  {
                    items[0]?.category_name ||

                    items[0]?.category ||

                    "-"
                  }

                </Typography>




                <Typography

                  mt={2}

                >

                  SKU :

                  {" "}

                  {
                    items[0]?.sku || "-"
                  }

                </Typography>




              </CardContent>



            </Card>



          </Grid>





        </Grid>









        <Paper

          sx={{

            p:3,

            mb:4,

            background:"#111827",

            borderRadius:3

          }}

        >



          <Typography

            variant="h6"

            fontWeight="700"

            color="white"

            mb={3}

          >

            Pricing Breakdown

          </Typography>







          <Table>



            <TableHead>


              <TableRow>


                <TableCell

                  sx={{
                    color:"#fff",
                    fontWeight:700
                  }}

                >

                  Product

                </TableCell>



                <TableCell

                  sx={{
                    color:"#fff",
                    fontWeight:700
                  }}

                >

                  Quantity

                </TableCell>




                <TableCell

                  sx={{
                    color:"#fff",
                    fontWeight:700
                  }}

                >

                  Unit Price

                </TableCell>





                <TableCell

                  sx={{
                    color:"#fff",
                    fontWeight:700
                  }}

                >

                  Discount

                </TableCell>





                <TableCell

                  sx={{
                    color:"#fff",
                    fontWeight:700
                  }}

                >

                  Tax

                </TableCell>





                <TableCell

                  sx={{
                    color:"#fff",
                    fontWeight:700
                  }}

                >

                  Total

                </TableCell>




              </TableRow>


            </TableHead>








            <TableBody>


            {

              items.length === 0 ?


              <TableRow>


                <TableCell

                  colSpan={6}

                  align="center"

                  sx={{
                    color:"#fff"
                  }}

                >

                  No products found

                </TableCell>



              </TableRow>



              :



              items.map(

                (item:any)=>(


                  <TableRow

                    key={item.id}

                  >



                    <TableCell

                      sx={{
                        color:"#e2e8f0"
                      }}

                    >

                    {
                      item.product_name ||

                      item.product?.name ||

                      item.product_id

                    }


                    </TableCell>





                    <TableCell

                      sx={{
                        color:"#e2e8f0"
                      }}

                    >

                    {
                      item.quantity
                    }

                    </TableCell>





                    <TableCell

                      sx={{
                        color:"#e2e8f0"
                      }}

                    >

                    {
                      formatCurrency(
                        item.unit_price
                      )
                    }

                    </TableCell>





                    <TableCell

                      sx={{
                        color:"#ef4444"
                      }}

                    >

                    {
                      formatCurrency(
                        item.discount
                      )
                    }

                    </TableCell>





                    <TableCell

                      sx={{
                        color:"#22c55e"
                      }}

                    >

                    {
                      formatCurrency(
                        item.tax
                      )
                    }

                    </TableCell>





                    <TableCell

                      sx={{
                        color:"#fff",
                        fontWeight:700
                      }}

                    >

                    {
                      formatCurrency(
                        item.total
                      )
                    }

                    </TableCell>




                  </TableRow>


                )

              )

            }


            </TableBody>


          </Table>



        </Paper>


        <Card

          sx={{

            background:"#111827",

            color:"#fff",

            borderRadius:3,

            mb:4

          }}

        >



          <CardContent>


            <Typography

              variant="h6"

              fontWeight="700"

              mb={3}

            >

              Invoice Summary

            </Typography>





            <Divider

              sx={{

                borderColor:"#334155",

                mb:3

              }}

            />





            <Box

              display="flex"

              justifyContent="space-between"

              mb={2}

            >

              <Typography>

                Subtotal

              </Typography>



              <Typography>

                {
                  formatCurrency(
                    subtotal
                  )
                }

              </Typography>



            </Box>








            <Box

              display="flex"

              justifyContent="space-between"

              mb={2}

            >


              <Typography>

                Discount Applied

              </Typography>




              <Typography

                color="#ef4444"

              >

                -

                {
                  formatCurrency(
                    discount
                  )
                }


              </Typography>



            </Box>








            <Box

              display="flex"

              justifyContent="space-between"

              mb={2}

            >


              <Typography>

                Tax

              </Typography>




              <Typography

                color="#22c55e"

              >

                +

                {
                  formatCurrency(
                    tax
                  )
                }


              </Typography>



            </Box>







            <Divider

              sx={{

                borderColor:"#334155",

                my:3

              }}

            />






            <Box

              display="flex"

              justifyContent="space-between"

              alignItems="center"

            >



              <Typography

                variant="h6"

                fontWeight="700"

              >

                Final Amount

              </Typography>





              <Typography

                variant="h5"

                fontWeight="700"

                color="#60a5fa"

              >

                {
                  formatCurrency(
                    sale.total_amount
                  )
                }


              </Typography>



            </Box>




          </CardContent>


        </Card>









        <Box

          display="flex"

          gap={2}

          flexWrap="wrap"

          mb={3}

        >




          <Button

            variant="contained"

            startIcon={
              <ArrowBackIcon/>
            }

            onClick={()=>navigate("/sales")}

            sx={{

              textTransform:"none",

              fontWeight:700

            }}

          >

            Back To Sales

          </Button>







          <Button

            variant="contained"

            color="warning"

            startIcon={
              <EditIcon/>
            }

            onClick={()=>


              navigate(
                `/sales/edit/${sale.id}`
              )


            }

            sx={{

              textTransform:"none",

              fontWeight:700

            }}

          >

            Edit Sale

          </Button>








          <Button

            variant="outlined"

            startIcon={
              <PrintIcon/>
            }

            onClick={()=>window.print()}

            sx={{

              color:"#fff",

              borderColor:"#64748b",

              textTransform:"none"

            }}

          >

            Print Invoice

          </Button>







        </Box>






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

          severity={snackbar.severity}

          variant="filled"

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