import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectUser } from './features/userSlice'
import db from './firebase'
import './PlanScreen.css'
import {loadStripe} from '@stripe/stripe-js'
function PlanScreen() {
    const [products,setProducts]=useState([])
    const [subscription,setSubscription]=useState(null)
    useEffect(()=>{
        db.collection('customers').doc(user.uid).collection('subscriptions').get()
        .then((querySnapshot)=>{
            querySnapshot.forEach(async (subscription)=>{
                setSubscription({
                    role:subscription.data().role,
                    current_period_end:subscription.data().current_period_end.seconds,
                    current_period_start:subscription.data().current_period_start.seconds

                })
            },[user.uid])
        })
    })
    const user=useSelector(selectUser)
    useEffect(()=>{
        db.collection('products').where('active','==',true).get().then((querySnapshot)=>{
            const products={}
            querySnapshot.forEach(async (productDoc)=>{
                products[productDoc.id]=productDoc.data()
                const priceSnap=await productDoc.ref.collection('prices').get()
                priceSnap.docs.forEach((price)=>{
                    products[productDoc.id].prices={
                        priceId: price.id,
                        priceData: price.data(),
                    }
                })
            })
            setProducts(products)
        })
    },[])
    console.log(products)
    const loadCheckout=async(priceId)=>{
        const docRef=await db.collection('customers').doc(user.uid)
        .collection('checkout_sessions').add({
            price:priceId,
            success_url:window.location.origin,
            cancel_url:window.loaction.origin,
        })
        docRef.onSnapshot(async (snap)=>{
            const {error,sessionId}=snap.data();
            if(error) alert(`An error occured: ${error.message}`)
            if(sessionId) {
                const stripe=await loadStripe("pk_test_51MPNCCSAP8TRDcY2AJd6kj1NR0MzakGL9ZW4tZPBZJkHkoSdOYGEQ88KJj3UKbeY5TNh8bDf3W1hzQncTbMCWLBx00DFiK8FPQ")
                stripe.redirectToCheckout({sessionId})
            }
        })
    }
  return (
    <div className='planscreen'>
        <br />
        {subscription && (
            <p>Renewal Date: 
                {new Date(subscription?.current_period_end*1000).toLocaleDateString()}</p>
        )}
        {Object.entries(products).map(([productId,productData])=>{
            const isCurrentPackage=productData.name?.toLowerCase().includes(subscription?.role)
            return (
                <div key={productId} className={`${isCurrentPackage && 'planscreen_sub'} planscreen_plan`}>
                    <div className="planscreen_info">
                        <h5>{productData.name}</h5>
                        <h6>{productData.description}</h6>
                    </div>
                    <button onClick={()=> !isCurrentPackage && loadCheckout.prices.priceId}>
                        {isCurrentPackage? 'Current Package':'Subscribe'}
                    </button>
                </div>
            )
        })}
    </div>
  )
}

export default PlanScreen