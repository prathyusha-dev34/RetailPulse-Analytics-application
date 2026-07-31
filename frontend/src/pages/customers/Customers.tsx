import {
  useEffect,
  useState
} from "react";


import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  MenuItem,
  CircularProgress
} from "@mui/material";


import {
  Visibility,
  Edit,
  Delete,
  CheckCircle,
  Cancel,
  Download
} from "@mui/icons-material";


import {
  useNavigate
} from "react-router-dom";


import {
  getCustomers,
  searchCustomers,
  filterCustomers,
  sortCustomers,
  deleteCustomer,
  activateCustomer,
  deactivateCustomer,
  getCustomerDashboard,
  exportCustomersCSV,
  exportCustomersPDF,
  exportCustomerAnalyticsPDF
} from "../../services/customerService";



// =====================================================
// COMPONENT
// =====================================================

export default function Customers(){


const navigate = useNavigate();


// =====================================================
// STATES
// =====================================================


const [customers,setCustomers] =
useState<any[]>([]);


const [dashboard,setDashboard] =
useState<any>({});


const [loading,setLoading] =
useState(false);


const [search,setSearch] =
useState("");


const [customerType,setCustomerType] =
useState("");


const [status,setStatus] =
useState("");


const [city,setCity] =
useState("");


const [state,setState] =
useState("");


const [country,setCountry] =
useState("");


const [fromDate,setFromDate] =
useState("");


const [toDate,setToDate] =
useState("");


const [sortBy,setSortBy] =
useState("");




// =====================================================
// NORMALIZE RESPONSE
// =====================================================


const normalizeCustomers = (
data:any[]
)=>{


return data.map(
(customer:any)=>({

...customer,


// backend compatibility

id:
customer.id,


customer_id:
customer.customer_id,


full_name:
customer.full_name ||
customer.customer_name ||
"-",


total_orders:
customer.total_orders || 0,


lifetime_revenue:
customer.lifetime_revenue ||
customer.total_revenue ||
0,


customer_segment:
customer.customer_segment ||
"New",


status:
customer.status ||
"ACTIVE"


})

);


};


// =====================================================
// LOAD DASHBOARD
// =====================================================

const loadDashboard = async () => {

  try {

    const response = await getCustomerDashboard();

    setDashboard(response || {});

  } catch (error) {

    console.log(
      "Dashboard Error",
      error
    );

    setDashboard({});

  }

};


// =====================================================
// LOAD CUSTOMERS
// =====================================================

const loadCustomers = async () => {

  try {

    setLoading(true);

    let response;

    if (search.trim()) {

      response = await searchCustomers(
        search.trim()
      );

    }

    else if (
      customerType ||
      status ||
      city ||
      state ||
      country ||
      fromDate ||
      toDate
    ) {

      response = await filterCustomers({

        customer_type: customerType,

        status: status,

        city: city,

        state: state,

        country: country,

        from_date: fromDate,

        to_date: toDate

      });

    }

    else if (sortBy) {

      response = await sortCustomers(
        sortBy
      );

    }

    else {

      response = await getCustomers();

    }

    console.log(
      "CUSTOMERS RESPONSE",
      response
    );

    let list:any[] = [];


if(Array.isArray(response)){

  list = response;

}

else if(
  Array.isArray(response?.data)
){

  list = response.data;

}

else if(
  Array.isArray(response?.customers)
){

  list = response.customers;

}

else if(
  Array.isArray(response?.items)
){

  list = response.items;

}

else if(
  Array.isArray(response?.results)
){

  list = response.results;

}


console.log(
  "FINAL CUSTOMER LIST",
  list
);


setCustomers(
  normalizeCustomers(list)
);
  }

  catch (error) {

    console.log(
      "Customer Load Error",
      error
    );

    setCustomers([]);

  }

  finally {

    setLoading(false);

  }

};


// =====================================================
// SEARCH
// =====================================================

const handleSearch = async () => {

  try {

    setLoading(true);

    const response =
      await searchCustomers(
        search.trim()
      );

    console.log(
      "SEARCH RESPONSE",
      response
    );

    let list: any[] = [];

    if (Array.isArray(response)) {

      list = response;

    }

    else if (
      Array.isArray(response?.customers)
    ) {

      list = response.customers;

    }

    else if (
      Array.isArray(response?.data)
    ) {

      list = response.data;

    }

    setCustomers(
      normalizeCustomers(list)
    );

  }

  catch (error) {

    console.log(
      "Search Error",
      error
    );

    setCustomers([]);

  }

  finally {

    setLoading(false);

  }

};


// =====================================================
// INITIAL LOAD
// =====================================================

useEffect(() => {

  loadCustomers();

  loadDashboard();

}, []);


// =====================================================
// DELETE CUSTOMER
// =====================================================

const handleDelete = async (
  id: number | string
) => {

  try {

    if (
      window.confirm(
        "Delete customer?"
      )
    ) {

      await deleteCustomer(id);

      await loadCustomers();

      await loadDashboard();

    }

  }

  catch (error) {

    console.log(
      "Delete Error",
      error
    );

  }

};


// =====================================================
// ACTIVATE / DEACTIVATE
// =====================================================

const handleStatus = async (
  id: number | string,
  current: string
) => {

  try {

    if (current === "ACTIVE") {

      await deactivateCustomer(id);

    }

    else {

      await activateCustomer(id);

    }

    await loadCustomers();

    await loadDashboard();

  }

  catch (error) {

    console.log(
      "Status Error",
      error
    );

  }

};


// =====================================================
// EXPORT FUNCTIONS
// =====================================================

const downloadFile = (
  data: any,
  filename: string
) => {

  const blob = new Blob([data]);

  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");

  link.href = url;

  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  window.URL.revokeObjectURL(url);

};


// =====================================================
// EXPORT CSV
// =====================================================

const handleExportCSV = async () => {

  try {

    const data = await exportCustomersCSV();

    downloadFile(
      data,
      "customers.csv"
    );

  }

  catch (error) {

    console.log(
      "CSV Export Error",
      error
    );

  }

};


// =====================================================
// EXPORT PDF
// =====================================================

const handleExportPDF = async () => {

  try {

    const data = await exportCustomersPDF();

    downloadFile(
      data,
      "customers.pdf"
    );

  }

  catch (error) {

    console.log(
      "PDF Export Error",
      error
    );

  }

};


// =====================================================
// EXPORT ANALYTICS PDF
// =====================================================

const handleAnalyticsPDF = async () => {

  try {

    const data =
      await exportCustomerAnalyticsPDF();

    downloadFile(
      data,
      "customer-analytics.pdf"
    );

  }

  catch (error) {

    console.log(
      "Analytics PDF Error",
      error
    );

  }

};


// =====================================================
// RETURN
// =====================================================

return (

<Box
  sx={{
    p: 3,
    background: "#0F172A",
    minHeight: "100vh",
    color: "white"
  }}
>

<Typography
  variant="h4"
  fontWeight="bold"
  mb={3}
>
  Customer Management
</Typography>


{/* ===================================================== */
/* DASHBOARD CARDS                                        */
/* ===================================================== */}

<Grid container spacing={3} mb={4}>

  <Grid item xs={12} md={3}>
    <Card sx={{ background: "#1E293B", color: "white" }}>
      <CardContent>
        <Typography>Total Customers</Typography>

        <Typography variant="h4">
          {dashboard.total_customers ?? customers.length}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={3}>
    <Card sx={{ background: "#1E293B", color: "white" }}>
      <CardContent>
        <Typography>Active Customers</Typography>

        <Typography variant="h4">
          {dashboard.active_customers ??
            customers.filter(
              (c) => c.status === "ACTIVE"
            ).length}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={3}>
    <Card sx={{ background: "#1E293B", color: "white" }}>
      <CardContent>
        <Typography>VIP Customers</Typography>

        <Typography variant="h4">
          {dashboard.vip_customers ??
            customers.filter(
              (c) =>
                c.customer_segment === "VIP"
            ).length}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

  <Grid item xs={12} md={3}>
    <Card sx={{ background: "#1E293B", color: "white" }}>
      <CardContent>
        <Typography>Total Revenue</Typography>

        <Typography variant="h4">
          ₹
          {dashboard.total_revenue_generated ?? 0}
        </Typography>
      </CardContent>
    </Card>
  </Grid>

</Grid>


{/* ===================================================== */
/* SEARCH + FILTERS                                       */
/* ===================================================== */}

<Box
  sx={{
    display: "flex",
    gap: 2,
    flexWrap: "wrap",
    mb: 3
  }}
>

<TextField
  label="Search"
  value={search}
  onChange={(e) =>
    setSearch(e.target.value)
  }
  onKeyDown={(e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }}
  sx={{
    background: "white",
    width: 260
  }}
/>

<TextField
  select
  label="Customer Type"
  value={customerType}
  onChange={(e) =>
    setCustomerType(
      e.target.value
    )
  }
  sx={{
    background: "white",
    width: 180
  }}
>
  <MenuItem value="">
    All
  </MenuItem>

  <MenuItem value="Retail">
    Retail
  </MenuItem>

  <MenuItem value="Wholesale">
    Wholesale
  </MenuItem>

  <MenuItem value="Corporate">
    Corporate
  </MenuItem>
</TextField>

<TextField
  select
  label="Status"
  value={status}
  onChange={(e) =>
    setStatus(e.target.value)
  }
  sx={{
    background: "white",
    width: 170
  }}
>
  <MenuItem value="">
    All
  </MenuItem>

  <MenuItem value="ACTIVE">
    ACTIVE
  </MenuItem>

  <MenuItem value="INACTIVE">
    INACTIVE
  </MenuItem>
</TextField>

<TextField
  label="City"
  value={city}
  onChange={(e) =>
    setCity(e.target.value)
  }
  sx={{
    background: "white",
    width: 170
  }}
/>

<TextField
  label="State"
  value={state}
  onChange={(e) =>
    setState(e.target.value)
  }
  sx={{
    background: "white",
    width: 170
  }}
/>

<TextField
  label="Country"
  value={country}
  onChange={(e) =>
    setCountry(e.target.value)
  }
  sx={{
    background: "white",
    width: 170
  }}
/>


<TextField
  type="date"
  label="From Date"
  InputLabelProps={{
    shrink: true
  }}
  value={fromDate}
  onChange={(e) =>
    setFromDate(e.target.value)
  }
  sx={{
    background: "white",
    width: 170
  }}
/>

<TextField
  type="date"
  label="To Date"
  InputLabelProps={{
    shrink: true
  }}
  value={toDate}
  onChange={(e) =>
    setToDate(e.target.value)
  }
  sx={{
    background: "white",
    width: 170
  }}
/>

<TextField
  select
  label="Sort By"
  value={sortBy}
  onChange={(e) =>
    setSortBy(e.target.value)
  }
  sx={{
    background: "white",
    width: 190
  }}
>
  <MenuItem value="">
    None
  </MenuItem>

  <MenuItem value="name">
    Name
  </MenuItem>

  <MenuItem value="total_spend">
    Total Spend
  </MenuItem>

  <MenuItem value="total_orders">
    Total Orders
  </MenuItem>

  <MenuItem value="last_purchase">
    Last Purchase
  </MenuItem>

  <MenuItem value="customer_since">
    Customer Since
  </MenuItem>
</TextField>

<Button
  variant="contained"
  onClick={loadCustomers}
>
  Search
</Button>

<Button
  variant="outlined"
  sx={{
    color: "white",
    borderColor: "white"
  }}
  onClick={() => {

    setSearch("");
    setCustomerType("");
    setStatus("");
    setCity("");
    setState("");
    setCountry("");
    setFromDate("");
    setToDate("");
    setSortBy("");

    loadCustomers();

  }}
>
  Clear
</Button>

<Button
  variant="contained"
  onClick={() =>
    navigate("/customers/add")
  }
>
  Add Customer
</Button>

</Box>


{/* ===================================================== */
/* EXPORT BUTTONS                                         */
/* ===================================================== */}

<Box
  sx={{
    display: "flex",
    gap: 2,
    mb: 3
  }}
>

<Button
  variant="contained"
  startIcon={<Download />}
  onClick={handleExportCSV}
>
  Export CSV
</Button>

<Button
  variant="contained"
  startIcon={<Download />}
  onClick={handleExportPDF}
>
  Customer PDF
</Button>

<Button
  variant="contained"
  startIcon={<Download />}
  onClick={handleAnalyticsPDF}
>
  Analytics PDF
</Button>

</Box>


{/* ===================================================== */
/* TABLE START                                            */
/* ===================================================== */}

<TableContainer
  component={Paper}
  sx={{
    background: "#1E293B"
  }}
>

{loading ? (

<Box
  sx={{
    display: "flex",
    justifyContent: "center",
    p: 5
  }}
>
  <CircularProgress />
</Box>

) : (

<Table>

<TableHead>

<TableRow>

<TableCell sx={{ color: "white" }}>ID</TableCell>

<TableCell sx={{ color: "white" }}>Name</TableCell>

<TableCell sx={{ color: "white" }}>Email</TableCell>

<TableCell sx={{ color: "white" }}>Phone</TableCell>

<TableCell sx={{ color: "white" }}>Type</TableCell>

<TableCell sx={{ color: "white" }}>Segment</TableCell>

<TableCell sx={{ color: "white" }}>Orders</TableCell>

<TableCell sx={{ color: "white" }}>Revenue</TableCell>

<TableCell sx={{ color: "white" }}>Status</TableCell>

<TableCell sx={{ color: "white" }}>Actions</TableCell>

</TableRow>

</TableHead>

<TableBody>

{customers.map((customer) => (

<TableRow
  key={customer.id}
>

<TableCell sx={{ color: "white" }}>
  {customer.customer_id}
</TableCell>

<TableCell sx={{ color: "white" }}>
  {customer.full_name}
</TableCell>

<TableCell sx={{ color: "white" }}>
  {customer.email || "-"}
</TableCell>

<TableCell sx={{ color: "white" }}>
  {customer.phone_number || "-"}
</TableCell>

<TableCell sx={{ color: "white" }}>
  {customer.customer_type || "-"}
</TableCell>

<TableCell sx={{ color: "white" }}>
  <Chip
    label={customer.customer_segment || "New"}
    color={
      customer.customer_segment === "VIP"
        ? "warning"
        : customer.customer_segment === "Loyal"
        ? "success"
        : "default"
    }
  />
</TableCell>

<TableCell sx={{ color: "white" }}>
  {customer.total_orders ?? 0}
</TableCell>

<TableCell sx={{ color: "white" }}>
  ₹{customer.lifetime_revenue ?? customer.total_revenue ?? 0}
</TableCell>

<TableCell>
  <Chip
    label={customer.status || "ACTIVE"}
    color={
      customer.status === "ACTIVE"
        ? "success"
        : "error"
    }
  />
</TableCell>

<TableCell>

<IconButton
  color="info"
  onClick={() =>
    navigate(`/customers/${customer.id}/profile`)
  }
>
  <Visibility />
</IconButton>

<IconButton
  color="warning"
  onClick={() =>
    navigate(`/customers/${customer.id}/edit`)
  }
>
  <Edit />
</IconButton>

<IconButton
  color="error"
  onClick={() =>
    handleDelete(customer.id)
  }
>
  <Delete />
</IconButton>

<IconButton
  color="success"
  onClick={() =>
    handleStatus(
      customer.id,
      customer.status
    )
  }
>
  {customer.status === "ACTIVE"
    ? <Cancel />
    : <CheckCircle />}
</IconButton>

</TableCell>

</TableRow>

))}


</TableBody>

</Table>

)}

</TableContainer>


{/* ================= EMPTY STATE ================= */}

{!loading && customers.length === 0 && (

<Box
  sx={{
    textAlign: "center",
    p: 5
  }}
>

<Typography
  variant="h6"
  color="white"
>
No Customers Found
</Typography>

<Typography
  color="white"
>
Try changing the search or filter values.
</Typography>

</Box>

)}


{/* ================= QUICK LINKS ================= */}

<Box
  sx={{
    mt: 4,
    display: "flex",
    gap: 2
  }}
>

<Button
  variant="outlined"
  sx={{
    color: "white",
    borderColor: "white"
  }}
  onClick={() =>
    navigate("/customers/analytics")
  }
>
Customer Analytics
</Button>

<Button
  variant="outlined"
  sx={{
    color: "white",
    borderColor: "white"
  }}
  onClick={() =>
    navigate("/customers/top-customers")
  }
>
Top Customers
</Button>

</Box>

</Box>

);

}