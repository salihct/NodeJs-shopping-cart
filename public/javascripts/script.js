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
            if(response.codSuccess){
                location.href='/order-success'
            }else{
                payOnline(response)
            }
        }
    })
})

function payOnline(order) {
    var options = {
        "key": "rzp_test_NDtsOV7RgyowuD", // Enter the Key ID generated from the Dashboard
        "amount": order.amount, // Amount is in currency subunits. Default currency is INR. Hence, 50000 refers to 50000 paise
        "currency": "INR",
        "name": "Salih CT",
        "description": "Test Transaction",
        "image": "https://example.com/your_logo",
        "order_id": order.id, //This is a sample Order ID. Pass the `id` obtained in the response of Step 1
        "handler": function (response){
            verifyPayment(response,order)
        },
        "prefill": {
            "name": "Gaurav Kumar",
            "email": "gaurav.kumar@example.com",
            "contact": "9999999999"
        },
        "notes": {
            "address": "Razorpay Corporate Office"
        },
        "theme": {
            "color": "#3399cc"
        }
    };
    var rzp1 = new Razorpay(options);
    rzp1.open()
    rzp1.on('payment.failed', function (response){

    });
    
}

function verifyPayment(payment,order) {
    $.ajax({
        url:'/verify-payment',
        data:{
            payment,
            order
        },
        method:'post',
        success:(response)=>{
            if(response.status){
                location.href='/order-success'
            }else{
                alert("Paymet failed")
            }
        }
    })
}

$(document).ready( function () {
    $('#viewproducts').DataTable();
});