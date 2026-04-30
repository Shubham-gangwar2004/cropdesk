import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/Home.css'

const Home = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) navigate('/feed')
  }, [navigate])

  return (
    <>
      <div className='home-container'>
        <div className='home-overlay'>
          <h1 className='home-tag'>Welcome to the CropDesk</h1>
          <p className='home-des'>Your gateway to Super Farming Marketplace.</p>
          <button onClick={() => window.location.href='/register'} className='get-started'>Get Started</button>
        </div>
      </div>
    </>
  )
}

export default Home
