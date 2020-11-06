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