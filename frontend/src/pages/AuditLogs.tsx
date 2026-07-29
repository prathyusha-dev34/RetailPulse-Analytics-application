import {
  useEffect,
  useMemo,
  useState,
} from "react";


import {
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";


import {
  Search,
  History,
  Login,
  Storage,
  Person,
  TrendingUp,
} from "@mui/icons-material";


import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";


import {
  getAuditLogs,
} from "../api/authApi";

interface AuditLog {

  id:number;

  company_id:number;

  user_id:number;

  entity_name?:string;

  action:string;

  ip_address?:string;

  browser?:string;

  created_at:string;

}



export default function AuditLogs(){


const [logs,setLogs]=useState<AuditLog[]>([]);


const [loading,setLoading]=useState(true);


const [search,setSearch]=useState("");



useEffect(()=>{

  fetchLogs();

},[]);



const fetchLogs=async()=>{

 try{

  const response =
    await getAuditLogs();


  setLogs(
    response.data
  );


 }

 catch(error){

  console.log(
    "Audit logs error",
    error
  );

 }

 finally{

  setLoading(false);

 }

};



const filteredLogs =
useMemo(()=>{


return logs.filter((log)=>{


const value =
search.toLowerCase();



return (

log.action
.toLowerCase()
.includes(value)

||

(log.entity_name || "")
.toLowerCase()
.includes(value)

);


});


},[
logs,
search
]);



const todayLogs =
logs.filter((log)=>
new Date(log.created_at)
.toDateString()
===
new Date()
.toDateString()
).length;



const loginLogs =
logs.filter((log)=>
log.action
.toLowerCase()
.includes("login")
).length;



const totalChanges =
logs.length;



return (


    <Box
  sx={{
    display: "flex",
    minHeight: "100vh",
    bgcolor: "#0F172A",
  }}
>

  <Sidebar />

  <Box
    sx={{
      flexGrow: 1,
      ml: "260px",
    }}
  >

    <Topbar />

    <Container
      maxWidth="xl"
      sx={{
        mt: 6,
        pb: 5,
      }}
    >

      {/* Header */}

      <Card
        sx={{
          mb: 3,
          borderRadius: 4,
          background:
            "linear-gradient(135deg,#1E293B,#334155)",
          color: "#fff",
        }}
      >

        <CardContent>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >

            <History
              sx={{
                fontSize: 42,
                color: "#60A5FA",
              }}
            />

            <Box>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                Audit Logs
              </Typography>

              <Typography
                sx={{
                  color: "#CBD5E1",
                }}
              >
                Monitor every activity performed
                inside your company.
              </Typography>

            </Box>

          </Box>

        </CardContent>

      </Card>


      {/* Dashboard Cards */}

      <Grid
        container
        spacing={3}
        sx={{
          mb: 3,
        }}
      >

        <Grid size={{ xs: 12, md: 4 }}>

          <Card
            sx={{
              bgcolor: "#1E293B",
              color: "#fff",
              borderRadius: 4,
            }}
          >

            <CardContent>

              <TrendingUp
                sx={{
                  color: "#3B82F6",
                  fontSize: 35,
                }}
              />

              <Typography
                mt={1}
                color="#94A3B8"
              >
                Total Logs
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {totalChanges}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid size={{ xs: 12, md: 4 }}>

          <Card
            sx={{
              bgcolor: "#1E293B",
              color: "#fff",
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Login
                sx={{
                  color: "#22C55E",
                  fontSize: 35,
                }}
              />

              <Typography
                mt={1}
                color="#94A3B8"
              >
                Login Activities
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {loginLogs}
              </Typography>

            </CardContent>

          </Card>

        </Grid>


        <Grid size={{ xs: 12, md: 4 }}>

          <Card
            sx={{
              bgcolor: "#1E293B",
              color: "#fff",
              borderRadius: 4,
            }}
          >

            <CardContent>

              <Storage
                sx={{
                  color: "#F59E0B",
                  fontSize: 35,
                }}
              />

              <Typography
                mt={1}
                color="#94A3B8"
              >
                Today's Logs
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
              >
                {todayLogs}
              </Typography>

            </CardContent>

          </Card>

        </Grid>

      </Grid>


            {/* Search */}

      <Card
        sx={{
          bgcolor: "#1E293B",
          borderRadius: 4,
          mb: 3,
        }}
      >
        <CardContent>

          <TextField
            fullWidth
            placeholder="Search by action or entity..."

            value={search}

            onChange={(e) =>
              setSearch(e.target.value)
            }

            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search
                    sx={{
                      color: "#94A3B8",
                    }}
                  />
                </InputAdornment>
              ),
            }}

            sx={{
              "& .MuiOutlinedInput-root": {
                bgcolor: "#0F172A",
                color: "#fff",
                borderRadius: 3,

                "& fieldset": {
                  borderColor: "#334155",
                },

                "&:hover fieldset": {
                  borderColor: "#3B82F6",
                },

                "&.Mui-focused fieldset": {
                  borderColor: "#3B82F6",
                },
              },

              "& input": {
                color: "#fff",
              },
            }}
          />

        </CardContent>
      </Card>



      {/* Audit Logs Table */}

      <TableContainer
        component={Paper}
        sx={{
          bgcolor: "#1E293B",
          borderRadius: 4,
          overflow: "auto",
        }}
      >

        <Table>

          <TableHead>

            <TableRow
              sx={{
                bgcolor: "#0F172A",
              }}
            >

              <TableCell
                sx={{
                  color: "#60A5FA",
                  fontWeight: 700,
                }}
              >
                Action
              </TableCell>

              <TableCell
                sx={{
                  color: "#60A5FA",
                  fontWeight: 700,
                }}
              >
                Entity
              </TableCell>

              <TableCell
                sx={{
                  color: "#60A5FA",
                  fontWeight: 700,
                }}
              >
                User
              </TableCell>

              <TableCell
                sx={{
                  color: "#60A5FA",
                  fontWeight: 700,
                }}
              >
                Company
              </TableCell>

              <TableCell
                sx={{
                  color: "#60A5FA",
                  fontWeight: 700,
                }}
              >
                Date & Time
              </TableCell>

            </TableRow>

          </TableHead>

          <TableBody>

            {loading ? (

              <TableRow>

                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{
                    color: "#fff",
                    py: 5,
                  }}
                >
                  Loading Audit Logs...
                </TableCell>

              </TableRow>

            ) : filteredLogs.length === 0 ? (

              <TableRow>

                <TableCell
                  colSpan={5}
                  align="center"
                  sx={{
                    color: "#94A3B8",
                    py: 5,
                  }}
                >
                  No Audit Logs Found
                </TableCell>

              </TableRow>

            ) : (

              filteredLogs.map((log) => (


                                <TableRow
                  key={log.id}
                  hover
                  sx={{
                    "&:hover": {
                      bgcolor: "#273449",
                    },
                  }}
                >

                  <TableCell>

                    <Chip
                      label={log.action}
                      color={
                        log.action
                          .toLowerCase()
                          .includes("login")
                          ? "success"
                          : log.action
                              .toLowerCase()
                              .includes("delete")
                          ? "error"
                          : "primary"
                      }
                      size="small"
                    />

                  </TableCell>


                  <TableCell
                    sx={{
                      color: "#fff",
                    }}
                  >
                    {log.entity_name || "-"}
                  </TableCell>


                  <TableCell
                    sx={{
                      color: "#fff",
                    }}
                  >
                    <Chip
                      icon={<Person />}
                      label={`User ${log.user_id}`}
                      size="small"
                      sx={{
                        bgcolor: "#334155",
                        color: "#fff",
                      }}
                    />
                  </TableCell>


                  <TableCell
                    sx={{
                      color: "#fff",
                    }}
                  >
                    #{log.company_id}
                  </TableCell>


                  <TableCell
                    sx={{
                      color: "#CBD5E1",
                    }}
                  >
                    {new Date(
                      log.created_at
                    ).toLocaleString()}
                  </TableCell>

                </TableRow>

              ))

            )}

          </TableBody>

        </Table>

      </TableContainer>

    </Container>

  </Box>

</Box>

);

}


