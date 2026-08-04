import api from "../api/axios";


// ===============================
// FORECAST INTERFACES
// ===============================


export interface ForecastDashboard {

  total_predicted_demand:number;

  products_expected_to_run_out:number;

  high_growth_products:number;

  slow_moving_products:number;

  forecast_accuracy:number;

  total_forecasts:number;

}




export interface ProductForecast {


  id:number;


  product_id:number;


  category_id:number;


  product_name:string;


  category_name:string;


  brand:string;


  current_stock:number;


  available_stock:number;


  reorder_level:number;


  historical_sales:number;


  predicted_demand:number;


  expected_growth_percentage:number;


  forecast_period:string;


  confidence_score:number;


  forecast_accuracy:number;


  recommendation:string;


  forecast_value:number;


  generated_at:string;


}




export interface CategoryForecast {


  category_id:number;


  category_name:string;


  total_historical_sales:number;


  predicted_demand:number;


  expected_growth_percentage:number;


  confidence_score:number;


  forecast_accuracy:number;


  forecast_value:number;


}




export interface Recommendation {


  product_id:number;


  product_name:string;


  category_name:string;


  current_stock:number;


  predicted_demand:number;


  recommendation:string;


  confidence_score:number;


}




export interface HistoricalForecast {


  period:string;


  historical_sales:number;


  predicted_sales:number;


}




export interface ProductTrend {


  product:string;


  demand:number;


}




export interface CategoryTrend {


  category:string;


  demand:number;


}




export interface SeasonalPattern {


  month:string;


  sales:number;


  forecast:number;


}




export interface ForecastAnalyticsResponse {


  dashboard:ForecastDashboard;


  product_forecasts:ProductForecast[];


  category_forecasts:CategoryForecast[];


  recommendations:Recommendation[];


  historical_vs_forecast:HistoricalForecast[];


  product_trend:ProductTrend[];


  category_trend:CategoryTrend[];


  seasonal_pattern:SeasonalPattern[];


  top_predicted_products?:ProductTrend[];


  slow_moving_products?:ProductTrend[];


  products_expected_to_run_out?:ProductTrend[];


}




// ===============================
// FORECAST SERVICE CLASS
// ===============================


class ForecastService {



  // ===============================
  // GENERATE FORECAST
  // ===============================


  async generateForecast(
    data:{
      forecast_period:string;
      start_date?:string;
      end_date?:string;
    }
  ){

    const response = await api.post(

      "/forecast/generate",

      data

    );


    return response.data;

  }





  // ===============================
  // REFRESH FORECAST
  // ===============================


  async refreshForecasts(){


    const response = await api.post(

      "/forecast/refresh"

    );


    return response.data;


  }





  // ===============================
  // ANALYTICS DASHBOARD
  // ===============================


  async getAnalytics(){


    const response =

      await api.get<ForecastAnalyticsResponse>(

        "/forecast/analytics"

      );


    return response.data;


  }






  // ===============================
  // GET PRODUCTS
  // ===============================


  async getProducts(

    params?:{

      forecast_period?:string;

      search?:string;

      category_id?:number;

      brand?:string;

      sort_by?:string;

    }

  ){


    const response = await api.get(

      "/forecast/products",

      {

        params

      }

    );


    return (

      response.data?.products ??

      response.data ??

      []

    );


  }






  // ===============================
  // GET CATEGORIES
  // ===============================


  async getCategories(){


    const response = await api.get(

      "/forecast/categories"

    );


    return response.data?.categories ??

           response.data ??

           [];


  }






  // ===============================
  // GET RECOMMENDATIONS
  // ===============================


  async getRecommendations(){


    const response = await api.get(

      "/forecast/recommendations"

    );


    return response.data?.recommendations ??

           response.data ??

           [];


  }



    // ===============================
  // GET DASHBOARD
  // ===============================


  async getDashboard(){


    const response = await api.get(

      "/forecast/dashboard"

    );


    return response.data;


  }






  // ===============================
  // TOP PRODUCTS
  // ===============================


  async getTopProducts(){


    const response = await api.get(

      "/forecast/top-products"

    );


    return response.data;


  }






  // ===============================
  // GENERATE NOTIFICATIONS
  // ===============================


  async generateNotifications(){


    const response = await api.post(

      "/forecast/notifications/generate"

    );


    return response.data;


  }






  // ===============================
  // SEARCH PRODUCTS
  // ===============================


  async searchProducts(

    keyword:string

  ){


    const response = await api.get(

      "/forecast/products/search",

      {

        params:{

          search:keyword

        }

      }

    );


    return response.data;


  }






  // ===============================
  // FILTER PRODUCTS
  // ===============================


  async filterProducts(

    params:any

  ){


    const response = await api.get(

      "/forecast/products/filter",

      {

        params

      }

    );


    return response.data;


  }






  // ===============================
  // SORT PRODUCTS
  // ===============================


  async sortProducts(

    sortBy:string

  ){


    const response = await api.get(

      "/forecast/products",

      {

        params:{

          sort_by:sortBy

        }

      }

    );


    return response.data;


  }






  // ===============================
  // DOWNLOAD HELPER
  // ===============================


  private downloadFile(

    blob:any,

    filename:string

  ){


    const url = window.URL.createObjectURL(

      new Blob([blob])

    );


    const link = document.createElement(

      "a"

    );


    link.href=url;


    link.download=filename;


    document.body.appendChild(link);


    link.click();


    link.remove();


    window.URL.revokeObjectURL(url);


  }







  // ===============================
  // EXPORT PRODUCT CSV
  // ===============================


  async exportProductsCSV(){


    const response = await api.get(

      "/forecast/export/products/csv",

      {

        responseType:"blob"

      }

    );


    this.downloadFile(

      response.data,

      "product_forecast.csv"

    );


  }







  // ===============================
  // EXPORT CATEGORY CSV
  // ===============================


  async exportCategoriesCSV(){


    const response = await api.get(

      "/forecast/export/categories/csv",

      {

        responseType:"blob"

      }

    );


    this.downloadFile(

      response.data,

      "category_forecast.csv"

    );


  }







  // ===============================
  // EXPORT PRODUCT PDF
  // ===============================


  async exportProductsPDF(){


    const response = await api.get(

      "/forecast/export/products/pdf",

      {

        responseType:"blob"

      }

    );


    this.downloadFile(

      response.data,

      "product_forecast.pdf"

    );


  }







  // ===============================
  // EXPORT CATEGORY PDF
  // ===============================


  async exportCategoriesPDF(){


    const response = await api.get(

      "/forecast/export/categories/pdf",

      {

        responseType:"blob"

      }

    );


    this.downloadFile(

      response.data,

      "category_forecast.pdf"

    );


  }







  // ===============================
  // COMPLETE REPORT EXPORT
  // ===============================


  async exportForecastReport(){


    const response = await api.get(

      "/forecast/export/report",

      {

        responseType:"blob"

      }

    );


    this.downloadFile(

      response.data,

      "forecast_report.pdf"

    );


  }



}




export default new ForecastService();