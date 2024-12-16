import logo from './logo.svg';
import './App.css';
import { BrowserRouter,Routes,Route, Form,   } from 'react-router-dom';
// import Home from './pages/Home';
import FormComponent from './pages/CSVUpload';
// import DataDisplay from './pages/DataDisplay';
import FileUpload from './pages/CSVUpload';
import CSVUpload from './pages/CSVUpload';

// import Test from './pages/Test';
// import AddProductForm from './pages/ViewData';
import ViewData from './pages/viewdata/ViewData';
import HomePage from './pages/homepage/HomePage';
import Nav from './components/Nav';
// import HomePage from './pages/HomePage';
// import ProductsTable from './pages/Test2';
// import ViewData from './pages/viewdata/ViewData';


function App() {
  return (
   <BrowserRouter>
   <Routes>
   {/* <Route path='/' element={<Home/>}/> */}
   {/* <Route path='/view-data' element={<DataDisplay/>}/> */}
   {/* <Route path='/upload-csv' element={<CSVUpload/>}/> */}
   <Route path='/csv-upload' element={<CSVUpload/>}/>
   <Route path='/' element={<HomePage/>}/>
  {/* <Route path='n' element={<AddProductForm/>}/> */}
  <Route path='/view-table' element={<ViewData/>}/>
  <Route path='/nav' element={<Nav/>}/>
   </Routes>
   </BrowserRouter>
  );
}

export default App;
