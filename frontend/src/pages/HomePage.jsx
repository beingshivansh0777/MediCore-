import React from 'react'
import Navbar from '../components/Navbar.jsx'
import Banner from '../components/Banner.jsx'
import Certification from '../components/Certification.jsx'
import HomeDoctor from '../components/HomeDoctor.jsx'
import Testimonial from '../components/Testimonial.jsx'
import Footer from '../components/Footer.jsx'

const Home = () => {
  return (
    <div>
      <Navbar/>
      <Banner/>
      <Certification/>
      <HomeDoctor/>
      <Testimonial/>
      <Footer/>
    </div>
  )
}

export default Home
