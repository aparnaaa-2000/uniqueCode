// import React from 'react';
// import './profile.css'; // Import the CSS file

// const Profile = () => {
//   return (
//     <div className="container">
//       <div className="header">
      
//         <h3>Product Unique Code Generation</h3> <br /> <br />
//         <button className="back-button">← Back</button>
//       </div>
//       <div className="card-container">
//         <div className="profile-card">
//           <div className="profile-icon">
//             {/* <i className="icon">👤</i> */}
           
//           </div>
//           <h2 className="title">Profile</h2>
//           <div className="field">
//             {/* <span className="label">Employee ID</span> */}
//             <input
//             type="text"
//             id="employeeId"
//             placeholder="Employee ID"
//             className="input-field"
//           />
//           </div>
//           <div className="field">
//           <input
//             type="email"
//             id="email"
//             placeholder="employee@gmail.com"
//             className="input-field"
//           />
//           </div>
//           <button className="logout">LOGOUT</button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Profile;
import React from "react";
import "./profile.css";
import '@fortawesome/fontawesome-free/css/all.min.css';



function Profile() {
  return (
    <div className="profile-container">
        <div className="header">
<div style={{  alignItems: "center", position:'absolute',top:'30px', left:'30px' , display:'flex'}}>
    
  <img
    src='/assets/rootments logo 2.jpg'
    alt="Logo"
    style={{ width: "50px", height: "50px", marginRight: "10px" }}
  />
  <h3 style={{ color: "black", margin: 0 }}>
    Product Unique Code Generation
  </h3>
  </div>
  <button className="btn btn-light text-success" style={{position:'absolute', top:'100px', left:'20px'}}>back</button>

</div>
<div className="main" style={{display:'flex', flexDirection:'column'}}>
<h2 className="profile-title" style={{display:'flex',justifyContent:'center'}}>Profile</h2>
        
      <div className="profile-card">
       
        <div className="profile-icon">
          <div className="icon-circle">
            <i
              className="fas fa-user user-icon"
              style={{ fontSize: "50px" , color:'white', alignItems:'center'}} // Custom size here
            ></i>
          </div>
        </div>
        <div className="input-group">
          <label htmlFor="employeeId" className="input-icon">
            <i className="fa-regular fa-user"
              style={{color:'#016E5B', fontSize:'20px'}}
            ></i>  </label>
          <input
            type="text"
            id="employeeId"
            placeholder="Employee ID"
            className="input-field"
          />
        </div>
        <div className="input-group">
          <label htmlFor="email" className="input-icon">
            <i className="fa-regular fa-envelope"
            style={{color:'#016E5B', fontSize:'20px'}}
            ></i>  </label>
          <input
            type="email"
            id="email"
            placeholder="employee@gmail.com"
            className="input-field"
          />
        </div>
        <div className="logout-text">LOGOUT</div>
      </div>
      </div>
    </div>
  );
}

export default Profile;
