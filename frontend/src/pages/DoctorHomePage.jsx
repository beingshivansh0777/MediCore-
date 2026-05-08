import React from 'react'
import DoctorNavbar from '../doctors/DoctorNavbar'
import DashboardPage from "../doctors/Dashboard"

const DoctorHome = () => {
  return (
    <div>
      <DoctorNavbar/>
      <DashboardPage/>
    </div>
  )
}

export default DoctorHome
