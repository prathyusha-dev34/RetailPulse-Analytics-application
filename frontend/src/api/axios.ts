import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api",

  headers: {
    "Content-Type": "application/json",
  },
});


// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {

    const token =
      localStorage.getItem("accessToken");

    console.log(
      "ACCESS TOKEN:",
      token
    );

    if (token) {

      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;

    }

    return config;
  },

  (error) => {

    return Promise.reject(error);

  }
);


// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(

  (response) => {

    return response;

  },

  (error) => {

    console.error(
      "API ERROR:",
      error?.response?.status,
      error?.response?.data ||
      error.message
    );

    return Promise.reject(error);

  }

);


export default api;