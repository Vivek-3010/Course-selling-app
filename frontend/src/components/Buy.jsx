import React, { useState } from 'react';
import {useParams, useNavigate} from "react-router-dom";
import toast from "react-hot-toast";
import axios from 'axios';

function Buy() {
  const {courseId} = useParams();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const token = user?.token;

  const handlePurchase = async ()=>{
    if(!token){
      toast.error("Please login to purchase a course");
      return;
    }
    try {
      const response = await axios.post(`http://localhost:4001/api/v1/course/buy/${courseId}`,{}, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        withCredentials: true,
      })
      toast.success(response.data.message || "Course purchased successfully");
      navigate("/purchases");
      setLoading(false);
    } catch (error) {
       setLoading(false);
       if(error?.response?.status === 400){
         toast.error("You have already purchased this course");
         navigate("/purchases");
       }else{
        toast.error(error.response?.data?.errors || "Error in purchasing course");
       }
    }
  }

  return (
    <div className='flex h-screen items-center justify-center'>
      <button className='bg-blue-500 text-white py-2 px-4 hover:bg-blue-800 rounded-md duration-300' onClick={handlePurchase} disabled = {loading}>{loading ? "Processing..." : "Buy now"}</button>
    </div>
  )
}

export default Buy
