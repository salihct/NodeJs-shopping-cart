function addToCart(prdctId){
    $.ajax({
        url:"/add-to-cart/"+prdctId,
        method:"get",
        success:(response) => {
            if(response.status){
                let count = $('#cart-count').html()
                count = parseInt(count)+1
                $('#cart-count').html(count)
            }
        }
    })
}

function changeQuantity(cartId,prdctId,userId,count){
    let quantity = parseInt(document.getElementById(prdctId).innerHTML)
    count = parseInt(count)
    $.ajax({
        url:'/change-product-quantity',
        data:{
            cart: cartId,
            product: prdctId,
            count: count,
            quantity: quantity,
            user: userId
        },
        method:'post',
        success:(response)=>{
            if(response.removeProduct) {
                alert('Product removed from cart')
                location.reload()
            }else{
                document.getElementById(prdctId).innerHTML=quantity+count
                document.getElementById('total').innerHTML=response.total
            }        
        }
    })
}

function removeItem(cartId,prdctId){
    $.ajax({
        url:'/remove-item',
        data:{
            cart: cartId,
            product: prdctId
        },
        method:'post',
        success:()=>{
            alert('Product removed from cart')
            location.reload()
        }
    })
}

$("#checkout-form").submit((e)=>{
    e.preventDefault()
    $.ajax({
        url:'/place-order',
        method:'POST',
        data:$("#checkout-form").serialize(),
        success:(response)=>{
            alert(response)
        }
    })
})