import { useEffect, useState } from "react";

import {
  Box,
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";


import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


import {
  getInventoryMovements,
} from "../api/inventoryApi";



interface Movement {


  id:number;

  inventory_id:number;

  movement_type:string;

  quantity_changed:number;

  previous_quantity:number;

  updated_quantity:number;

  reason:string;

  remarks:string | null;

  performed_by:number;

  created_at:string;


}



export default function InventoryMovements(){


  const [movements,setMovements] =
    useState<Movement[]>([]);



  const loadMovements = async()=>{


    const data =
      await getInventoryMovements();


    setMovements(data);


  };



  useEffect(()=>{


    loadMovements();


  },[]);



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



          <Typography

            variant="h4"

            color="white"

            fontWeight={700}

            mb={3}

          >

            Inventory Movement History

          </Typography>



          <TableContainer

            component={Paper}

            sx={{

              bgcolor:"#1E293B",

              borderRadius:3,

            }}

          >


            <Table>


              <TableHead>


                <TableRow>


                  {
                    [
                      "Movement Type",
                      "Previous",
                      "Updated",
                      "Quantity",
                      "Reason",
                      "Remarks",
                      "Performed By",
                      "Date",
                    ].map(
                      (head)=>(
                        <TableCell

                          key={head}

                          sx={{
                            color:"white",
                            fontWeight:700,
                          }}

                        >

                          {head}

                        </TableCell>
                      )
                    )
                  }


                </TableRow>


              </TableHead>

                
              <TableBody>


                {
                  movements.length === 0 ? (

                    <TableRow>


                      <TableCell

                        colSpan={8}

                        align="center"

                        sx={{
                          color:"#CBD5E1",
                          py:5,
                        }}

                      >

                        No Stock Movements Found

                      </TableCell>


                    </TableRow>


                  ) : (


                    movements.map((item)=>(


                      <TableRow

                        key={item.id}

                      >



                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {item.movement_type}

                        </TableCell>



                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {item.previous_quantity}

                        </TableCell>



                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {item.updated_quantity}

                        </TableCell>



                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {item.quantity_changed}

                        </TableCell>




                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {item.reason}

                        </TableCell>




                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {item.remarks || "-"}

                        </TableCell>




                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {item.performed_by}

                        </TableCell>




                        <TableCell
                          sx={{
                            color:"white",
                          }}
                        >

                          {
                            new Date(
                              item.created_at
                            ).toLocaleString()
                          }

                        </TableCell>



                      </TableRow>


                    ))


                  )

                }



              </TableBody>


            </Table>


          </TableContainer>



        </Container>



      </Box>



    </Box>


  );


}

