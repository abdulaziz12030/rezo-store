
"use client"
import { useState } from "react"

export default function Cart() {
  const [cart, setCart] = useState([
    {id:1, name:"منتج", qty:1}
  ])

  const removeItem = (id:any)=>{
    setCart(cart.filter(i=>i.id!==id))
  }

  return (
    <div style={{padding:20}}>
      {cart.map(i=>(
        <div key={i.id}>
          {i.name}
          <button onClick={()=>removeItem(i.id)}>حذف</button>
        </div>
      ))}
    </div>
  )
}
